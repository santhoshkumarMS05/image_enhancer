"""
Visionexa AI — Intelligent Image Enhancement Engine v3.0
=========================================================
Pure OpenCV + PIL + NumPy pipeline. No external API keys needed.

DESIGN PHILOSOPHY (v3.0) — "Portrait-First, Region-Aware":
  ┌─ FACE REGION ──────────────────────────────────────────────┐
  │  • Portrait bilateral smoothing (skin texture cleanup)     │
  │  • NO sharpening on face — it makes skin look rough        │
  │  • NO brightness on face — it washes out facial contrast   │
  │  • NO detailEnhance on face — it amplifies pores/wrinkles  │
  └────────────────────────────────────────────────────────────┘
  ┌─ BACKGROUND / CLOTHING REGION ──────────────────────────────┐
  │  • Very light bilateral clean                               │
  │  • Detail enhancement OK (clothes/textures look crisper)   │
  │  • Brightness: only 1/10 level if truly dark background    │
  │  • Contrast: very conservative CLAHE                       │
  │  • Dark clothing (black/grey) must STAY dark               │
  └────────────────────────────────────────────────────────────┘

Core Rules:
  1. DETECT faces → create inverted mask for background
  2. Process face region with portrait bilateral only
  3. Process background separately with detail + mild contrast
  4. Recombine using the masks
  5. Brightness: max 1/10 strength, only "Very Dark" + histogram confirmed
  6. No global sharpening ever — only background if truly blurry
  7. Final blend with original at 80% to preserve authenticity

Enhancement Modes:
  - natural  : 0.25 strength
  - balanced : 0.50 strength
  - strong   : 0.75 strength (NOT 1.0 — always leave headroom)
"""

import os
import cv2
import numpy as np
from PIL import Image, ImageEnhance

# ═══════════════════════════════════════════════════════════
#  HAAR CASCADE PATH
# ═══════════════════════════════════════════════════════════

HAAR_CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"


# ═══════════════════════════════════════════════════════════
#  IMAGE ANALYZER
# ═══════════════════════════════════════════════════════════

class ImageAnalyzer:
    """Analyzes an image and returns quality scores for all metrics."""

    def analyze(self, image_path: str) -> dict:
        """Run full analysis on the image and return a quality report."""
        img_bgr = cv2.imread(image_path)
        if img_bgr is None:
            return self._empty_report()

        img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        h, w = img_bgr.shape[:2]

        blur        = self._analyze_blur(img_gray)
        noise       = self._analyze_noise(img_gray)
        resolution  = self._analyze_resolution(w, h)
        brightness  = self._analyze_brightness(img_bgr)
        contrast    = self._analyze_contrast(img_gray)
        color       = self._analyze_color(img_bgr)
        faces       = self._detect_faces(img_gray)
        histogram   = self._analyze_histogram(img_gray)

        return {
            "blur":       blur,
            "noise":      noise,
            "resolution": resolution,
            "brightness": brightness,
            "contrast":   contrast,
            "color":      color,
            "faces":      faces,
            "histogram":  histogram,
        }

    # ── Individual Analyzers ──────────────────────────────

    def _analyze_blur(self, gray: np.ndarray) -> dict:
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        score = round(float(variance), 2)
        if score < 50:    label = "High Blur"
        elif score < 300: label = "Medium Blur"
        else:             label = "Low Blur"
        return {"score": score, "label": label}

    def _analyze_noise(self, gray: np.ndarray) -> dict:
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        median_val = np.median(np.abs(laplacian))
        sigma = round(float(median_val * 1.4826), 2)
        if sigma > 30:    label = "High Noise"
        elif sigma > 10:  label = "Medium Noise"
        else:             label = "Low Noise"
        return {"score": sigma, "label": label}

    def _analyze_resolution(self, w: int, h: int) -> dict:
        total = w * h
        if total >= 2_073_600:  quality = "High Quality"
        elif total >= 921_600:  quality = "Medium Quality"
        else:                   quality = "Low Quality"
        return {"quality": quality, "width": w, "height": h}

    def _analyze_brightness(self, img_bgr: np.ndarray) -> dict:
        """
        Uses HSV V-channel mean.
        Thresholds are strict — 'Dark' only applies to genuinely dark images.
        """
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        mean_v = float(np.mean(hsv[:, :, 2]))
        score = round(mean_v, 2)
        # Very strict thresholds — don't touch cinematic/moody images
        if score < 35:    label = "Very Dark"
        elif score < 65:  label = "Dark"
        elif score < 210: label = "Normal"
        elif score < 240: label = "Bright"
        else:             label = "Overexposed"
        return {"score": score, "label": label}

    def _analyze_contrast(self, gray: np.ndarray) -> dict:
        std = float(np.std(gray))
        score = round(std, 2)
        if score < 25:    label = "Low Contrast"
        elif score < 50:  label = "Medium Contrast"
        else:             label = "Good Contrast"
        return {"score": score, "label": label}

    def _analyze_color(self, img_bgr: np.ndarray) -> dict:
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        mean_s = float(np.mean(hsv[:, :, 1]))
        score = round(mean_s, 2)
        if score < 30:    label = "Dull"
        elif score < 80:  label = "Moderate"
        else:             label = "Vibrant"
        return {"score": score, "label": label}

    def _detect_faces(self, gray: np.ndarray) -> dict:
        face_cascade = cv2.CascadeClassifier(HAAR_CASCADE_PATH)
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5,
            minSize=(30, 30), flags=cv2.CASCADE_SCALE_IMAGE,
        )
        face_list = []
        if isinstance(faces, np.ndarray):
            for (x, y, w, h) in faces:
                face_list.append({"x": int(x), "y": int(y), "w": int(w), "h": int(h)})
        return {"count": len(face_list), "regions": face_list}

    def _analyze_histogram(self, gray: np.ndarray) -> dict:
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
        total_pixels = gray.shape[0] * gray.shape[1]
        hist_norm = hist / total_pixels
        dark_ratio   = float(np.sum(hist_norm[:64]))
        mid_ratio    = float(np.sum(hist_norm[64:192]))
        bright_ratio = float(np.sum(hist_norm[192:]))
        if dark_ratio > 0.75:    exposure = "Underexposed"
        elif bright_ratio > 0.6: exposure = "Overexposed"
        elif mid_ratio > 0.4:    exposure = "Well Exposed"
        else:                    exposure = "Mixed Exposure"
        return {
            "dark_ratio":   round(dark_ratio, 3),
            "mid_ratio":    round(mid_ratio, 3),
            "bright_ratio": round(bright_ratio, 3),
            "exposure":     exposure,
        }

    def _empty_report(self) -> dict:
        return {
            "blur":       {"score": 0, "label": "Unknown"},
            "noise":      {"score": 0, "label": "Unknown"},
            "resolution": {"quality": "Unknown", "width": 0, "height": 0},
            "brightness": {"score": 0, "label": "Unknown"},
            "contrast":   {"score": 0, "label": "Unknown"},
            "color":      {"score": 0, "label": "Unknown"},
            "faces":      {"count": 0, "regions": []},
            "histogram":  {"dark_ratio": 0, "mid_ratio": 0, "bright_ratio": 0, "exposure": "Unknown"},
        }


# ═══════════════════════════════════════════════════════════
#  IMAGE ENHANCER v3.0 — Portrait-First, Region-Aware
# ═══════════════════════════════════════════════════════════

class ImageEnhancer:
    """
    Region-aware enhancement pipeline.
    - Face: portrait bilateral smoothing only — no sharpening, no brightness
    - Background: light cleanup + optional detail/contrast
    - Brightness: 1/10 level max, only when truly needed
    """

    MODES = {
        "natural":  0.25,
        "balanced": 0.50,
        "strong":   0.75,
    }

    def enhance(self, image_path: str, output_path: str, analysis: dict, mode: str = "balanced") -> dict:
        strength = self.MODES.get(mode, 0.50)
        enhancements_applied = []

        img = cv2.imread(image_path)
        if img is None:
            return {"enhancements": [], "error": "Could not read image"}

        # ── Always Upscale 2x at the start (Lanczos) ──
        img = self._upscale(img, 2)
        original = img.copy()
        enhancements_applied.append("Upscaled 2x (Lanczos)")

        # Scale face regions coordinates by 2x to match upscaled resolution
        face_regions = analysis.get("faces", {}).get("regions", [])
        scaled_faces = []
        for face in face_regions:
            scaled_faces.append({
                "x": face["x"] * 2,
                "y": face["y"] * 2,
                "w": face["w"] * 2,
                "h": face["h"] * 2
            })

        noise_label  = analysis.get("noise", {}).get("label", "")
        blur_label   = analysis.get("blur", {}).get("label", "")

        # ── Filter faces to exclude small background faces ──
        filtered_faces = []
        is_group_photo = False
        avg_face_w = 0.0

        if len(scaled_faces) > 0:
            sorted_faces = sorted(scaled_faces, key=lambda f: f["w"] * f["h"], reverse=True)
            max_w = sorted_faces[0]["w"]
            if max_w > 240:
                filter_thresh = 0.50
            elif max_w > 160:
                filter_thresh = 0.45
            else:
                filter_thresh = 0.40
            filtered_faces = [f for f in scaled_faces if f["w"] >= filter_thresh * max_w]
            avg_face_w = sum(f["w"] for f in filtered_faces) / len(filtered_faces)
            if len(filtered_faces) >= 3:
                is_group_photo = True

        # ── Determine effective smoothing strength ──
        smoothing_strength = strength
        if len(filtered_faces) > 0:
            face_scale = min(1.0, avg_face_w / 300.0)
            if is_group_photo:
                smoothing_strength = strength * 0.4
            else:
                smoothing_strength = strength * max(0.5, face_scale)
        smoothing_strength = float(np.clip(smoothing_strength, 0.1, 1.0))

        # ── Masks ─────────────────────────────────────────
        # person_mask covers: face + body + hands + hair + clothing (soft for smoothing)
        # bg_mask covers true background only (tight to protect clothing/face from bleed)
        person_mask, person_mask_tight = self._build_person_masks(img.shape, filtered_faces)
        bg_mask     = 1.0 - person_mask_tight

        # ── 2. Global light denoise (very conservative) ───
        img = self._global_denoise(img, noise_label)
        enhancements_applied.append("Light Cleanup")

        # ── 3. PERSON: Broad smooth over the whole subject ─
        img = self._smooth_person(img, person_mask, smoothing_strength, avg_face_w)
        if len(filtered_faces) > 0:
            if is_group_photo:
                enhancements_applied.append(f"Group Person Smoothing ({len(filtered_faces)} faces — gentle)")
            else:
                enhancements_applied.append(f"Person Smoothing ({len(filtered_faces)} face{'s' if len(filtered_faces) > 1 else ''})")
        else:
            enhancements_applied.append("Subject Smoothing (center region)")

        # ── 3b. SKIN: Targeted smooth on ALL visible skin ──
        skin_mask = self._build_skin_mask(img)
        # Restrict skin mask to the main person region only
        skin_mask = skin_mask * person_mask
        if skin_mask.max() > 0:
            img = self._smooth_skin(img, skin_mask, smoothing_strength, avg_face_w)
            enhancements_applied.append("Skin Smoothing (neck / arms / hands)")

        # ── 3c. CLOTHING: Soften shirt/dress texture ───────
        clothing_mask = np.clip(person_mask - skin_mask * 0.8, 0.0, 1.0).astype(np.float32)
        if clothing_mask.max() > 0:
            img = self._soften_clothing(img, clothing_mask, smoothing_strength)
            enhancements_applied.append("Clothing Texture Softened")

        # ── 4. BACKGROUND: Detail enhancement ONLY ─────────
        if noise_label == "Low Noise":
            img = self._enhance_background(img, bg_mask, strength)
            enhancements_applied.append("Background Detail Enhancement")

        # ── 5. BACKGROUND: Rich Contrast & Exposure Curve ──
        contrast_label = analysis.get("contrast", {}).get("label", "")
        brightness_label = analysis.get("brightness", {}).get("label", "")
        exposure_label = analysis.get("histogram", {}).get("exposure", "")

        img = self._apply_rich_exposure_curve(img, bg_mask, brightness_label, contrast_label, exposure_label, strength)
        if contrast_label == "Low Contrast" or (brightness_label == "Very Dark" and exposure_label == "Underexposed"):
            enhancements_applied.append("Rich Background Exposure & Contrast Curve")

        # ── 7. Color — subtle, background-biased ──────────
        color_label = analysis.get("color", {}).get("label", "")
        if color_label == "Dull":
            img = self._subtle_color(img, strength)
            enhancements_applied.append("Subtle Color Boost")

        # ── 8. Final blend with original ──────────────────
        if original.shape[:2] != img.shape[:2]:
            original = cv2.resize(original, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_LANCZOS4)
        img = cv2.addWeighted(img, 0.80, original, 0.20, 0)

        # ── Save ──────────────────────────────────────────
        ext = os.path.splitext(output_path)[1].lower()
        if ext in (".jpg", ".jpeg"):
            cv2.imwrite(output_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        elif ext == ".png":
            cv2.imwrite(output_path, img, [cv2.IMWRITE_PNG_COMPRESSION, 3])
        else:
            cv2.imwrite(output_path, img)

        return {"enhancements": enhancements_applied, "mode": mode}

    # ═══════════════════════════════════════════════════════
    #  MASK HELPERS
    # ═══════════════════════════════════════════════════════

    def _build_person_masks(self, shape: tuple, face_regions: list) -> tuple:
        """
        Build soft and tight person masks from face detections.
        - Soft mask (heavily blurred) is used for smoothing to blend details invisibly.
        - Tight mask (slightly blurred) is used to protect the person from background exposure/brightness edits.
        """
        h, w = shape[:2]
        mask_base = np.zeros((h, w), dtype=np.float32)

        if len(face_regions) > 0:
            for face in face_regions:
                fx, fy, fw, fh = face["x"], face["y"], face["w"], face["h"]

                # Expand to cover full body
                top    = max(0,  fy - int(fh * 0.8))
                bottom = min(h,  fy + fh + int(fh * 4.5))
                left   = max(0,  fx - int(fw * 1.5))
                right  = min(w,  fx + fw + int(fw * 1.5))

                mask_base[top:bottom, left:right] = 1.0
        else:
            # Center-biased ellipse fallback
            cy, cx = h // 2, w // 2
            ry = int(h * 0.45)
            rx = int(w * 0.40)
            cv2.ellipse(mask_base, (cx, cy), (rx, ry), 0, 0, 360, 1.0, -1)

        # Soft mask with heavy Gaussian feather for smooth smoothing transition
        blur_soft = max(51, (min(h, w) // 8) | 1)
        person_mask_soft = cv2.GaussianBlur(mask_base, (blur_soft, blur_soft), 0)
        if person_mask_soft.max() > 0:
            person_mask_soft = person_mask_soft / person_mask_soft.max()

        # Tight mask with small Gaussian feather to prevent background adjustments from bleeding onto the subject
        blur_tight = max(15, (min(h, w) // 40) | 1)
        person_mask_tight = cv2.GaussianBlur(mask_base, (blur_tight, blur_tight), 0)
        if person_mask_tight.max() > 0:
            person_mask_tight = person_mask_tight / person_mask_tight.max()

        return person_mask_soft, person_mask_tight

    def _blend_with_mask(self, base: np.ndarray, enhanced: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """Blend two images using a float32 mask (0.0–1.0)."""
        m = mask[:, :, np.newaxis]
        result = m * enhanced.astype(np.float32) + (1.0 - m) * base.astype(np.float32)
        return np.clip(result, 0, 255).astype(np.uint8)

    # ═══════════════════════════════════════════════════════
    #  PROCESSING FUNCTIONS
    # ═══════════════════════════════════════════════════════

    def _upscale(self, img: np.ndarray, scale: int) -> np.ndarray:
        h, w = img.shape[:2]
        return cv2.resize(img, (w * scale, h * scale), interpolation=cv2.INTER_LANCZOS4)

    def _global_denoise(self, img: np.ndarray, noise_label: str) -> np.ndarray:
        """
        Very light global bilateral to remove sensor noise.
        Keeps edges sharp. Never use NLM globally — too slow and can wash out detail.
        """
        if noise_label == "High Noise":
            # Slightly stronger but still conservative
            return cv2.bilateralFilter(img, d=7, sigmaColor=35, sigmaSpace=35)
        elif noise_label == "Medium Noise":
            return cv2.bilateralFilter(img, d=5, sigmaColor=25, sigmaSpace=25)
        else:
            # Low noise — barely touch it
            return cv2.bilateralFilter(img, d=3, sigmaColor=15, sigmaSpace=15)

    def _smooth_person(self, img: np.ndarray, person_mask: np.ndarray, strength: float, avg_face_w: float = 150.0) -> np.ndarray:
        """
        Smooth the entire person region (face, body, clothing, hands, hair).

        KEY: Works in LAB color space (L channel only) to preserve original colors.
        Dynamically adjusts kernel size and caps blend weight for realistic texture.
        """
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        # Dynamically determine filter window size based on face size (scaled for 2x upscale)
        if avg_face_w > 0 and avg_face_w < 100:
            d1, d2 = 5, 5
        elif avg_face_w > 0 and avg_face_w < 200:
            d1, d2 = 5, 7
        else:
            d1, d2 = 7, 9

        # Pass 1 — light cleanup on luminance only
        sigma1 = int(30 + 20 * strength)   # 30 to 45
        l1 = cv2.bilateralFilter(l, d=d1, sigmaColor=sigma1, sigmaSpace=sigma1)

        # Pass 2 — portrait-quality smooth on luminance only
        sigma2 = int(45 + 25 * strength)   # 45 to 64
        l2 = cv2.bilateralFilter(l1, d=d2, sigmaColor=sigma2, sigmaSpace=sigma2)

        # Reconstruct with ORIGINAL color channels
        lab_smoothed = cv2.merge([l2, a, b])
        smoothed = cv2.cvtColor(lab_smoothed, cv2.COLOR_LAB2BGR)

        # Cap mask opacity to preserve natural skin pores and realistic texture
        blend_limit = 0.55 + 0.33 * (strength - 0.25)
        blend_limit = np.clip(blend_limit, 0.50, 0.80)
        capped_mask = person_mask * blend_limit

        return self._blend_with_mask(img, smoothed, capped_mask)

    def _build_skin_mask(self, img: np.ndarray) -> np.ndarray:
        """
        Detect ALL visible skin pixels using YCrCb colour space.
        This catches face, neck, arms, hands — any exposed skin.

        YCrCb ranges proven for broad skin detection:
          Cr: 133–180  (red-difference channel)
          Cb:  77–130  (blue-difference channel)
        Morphological close fills small gaps (e.g., between fingers).
        Result is a float32 mask 0.0–1.0, Gaussian-feathered.
        """
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        cr = ycrcb[:, :, 1]
        cb = ycrcb[:, :, 2]

        skin_binary = (
            (cr >= 133) & (cr <= 180) &
            (cb >=  77) & (cb <= 130)
        ).astype(np.uint8) * 255

        # Morphological close to fill gaps (e.g., between fingers)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        skin_binary = cv2.morphologyEx(skin_binary, cv2.MORPH_CLOSE, kernel)

        # Feather edges for smooth blending
        skin_mask = skin_binary.astype(np.float32) / 255.0
        skin_mask = cv2.GaussianBlur(skin_mask, (21, 21), 0)
        return skin_mask

    def _smooth_skin(self, img: np.ndarray, skin_mask: np.ndarray, strength: float, avg_face_w: float = 150.0) -> np.ndarray:
        """
        Portrait-quality smooth on ALL detected skin pixels (face, neck, arms, hands).

        KEY: Operates ONLY on the L channel in LAB space to preserve skin tones.
        Dynamically adjusts kernel size and caps blend weight for realistic texture.
        """
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        # Dynamically determine filter window size based on face size (scaled for 2x upscale)
        if avg_face_w > 0 and avg_face_w < 100:
            d_skin = 7
        elif avg_face_w > 0 and avg_face_w < 200:
            d_skin = 9
        else:
            d_skin = 11

        sigma = int(55 + 25 * strength)   # 55 to 74
        l_smooth = cv2.bilateralFilter(l, d=d_skin, sigmaColor=sigma, sigmaSpace=sigma)

        # Reconstruct with original A and B — color is 100% preserved
        lab_smooth = cv2.merge([l_smooth, a, b])
        smoothed = cv2.cvtColor(lab_smooth, cv2.COLOR_LAB2BGR)

        # Cap mask opacity to preserve natural skin pores and realistic texture
        blend_limit = 0.55 + 0.33 * (strength - 0.25)
        blend_limit = np.clip(blend_limit, 0.50, 0.80)
        capped_mask = skin_mask * blend_limit

        return self._blend_with_mask(img, smoothed, capped_mask)

    def _soften_clothing(self, img: np.ndarray, clothing_mask: np.ndarray, strength: float) -> np.ndarray:
        """
        Reduce shirt / dress texture while strictly preserving color.

        KEY: Bilateral is applied to the L channel in LAB space only.
        """
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        # Surface-blur the luminance — smooths texture, keeps color
        sigma_c = int(60 + 20 * strength)   # 60 to 75
        sigma_s = int(40 + 10 * strength)   # 40 to 47
        l_soft = cv2.bilateralFilter(l, d=13, sigmaColor=sigma_c, sigmaSpace=sigma_s)

        # Gentle scaling to preserve dark values (scale 0.98 - 0.99)
        l_scale = 0.98 - 0.01 * strength
        l_soft = np.clip(l_soft.astype(np.float32) * l_scale, 0, 255).astype(np.uint8)

        # Reconstruct with original color channels
        lab_soft = cv2.merge([l_soft, a, b])
        softened = cv2.cvtColor(lab_soft, cv2.COLOR_LAB2BGR)

        # Cap opacity for clothing softening to keep natural shadows and structure
        blend_limit = 0.60 + 0.20 * strength  # 0.65 to 0.75
        capped_mask = clothing_mask * blend_limit

        return self._blend_with_mask(img, softened, capped_mask)

    def _enhance_background(self, img: np.ndarray, bg_mask: np.ndarray, strength: float) -> np.ndarray:
        """
        Detail enhancement ONLY on the background/clothing region.
        Uses cv2.detailEnhance which is edge-preserving.
        Does NOT touch face regions.
        """
        sigma_s = 8 + 8 * strength     # 8 to 14
        sigma_r = 0.08 + 0.05 * strength  # 0.08 to 0.11

        detailed = cv2.detailEnhance(img, sigma_s=sigma_s, sigma_r=sigma_r)

        # Blend: only background gets the detail boost
        return self._blend_with_mask(img, detailed, bg_mask)

    def _apply_rich_exposure_curve(self, img: np.ndarray, bg_mask: np.ndarray,
                                   brightness_label: str, contrast_label: str,
                                   exposure_label: str, strength: float) -> np.ndarray:
        """
        Apply a mathematically smooth S-curve to adjust background brightness and contrast.
        Keeps deep shadows rich (shadow protection) and highlights clean (highlight protection).
        Runs on L channel in LAB space only to preserve original color tones.
        """
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        # Convert L to float32 normalized to [0, 1]
        l_norm = l.astype(np.float32) / 255.0

        # 1. Determine lift coefficient (midtone brightness lift)
        lift_coeff = 0.0
        if brightness_label == "Very Dark" and exposure_label == "Underexposed":
            lift_coeff = 0.15 * strength  # Capped for rich look
        elif brightness_label == "Dark" and exposure_label == "Underexposed":
            lift_coeff = 0.08 * strength

        # 2. Determine contrast coefficient (S-curve contrast boost)
        contrast_coeff = 0.0
        if contrast_label == "Low Contrast":
            contrast_coeff = 0.12 * strength
        elif contrast_label == "Medium Contrast":
            contrast_coeff = 0.06 * strength

        # S-Curve transformation with shadow and highlight protection
        # y = x + lift * x^1.5 * (1 - x) + contrast * x * (1 - x) * (x - 0.5)
        l_new = l_norm + lift_coeff * (l_norm ** 1.5) * (1.0 - l_norm) + \
                contrast_coeff * l_norm * (1.0 - l_norm) * (l_norm - 0.5)

        # Clip and convert back to uint8
        l_new = np.clip(l_new * 255.0, 0, 255).astype(np.uint8)

        # Reconstruct and convert to BGR
        lab_new = cv2.merge([l_new, a, b])
        enhanced_img = cv2.cvtColor(lab_new, cv2.COLOR_LAB2BGR)

        # Blend using the background mask
        return self._blend_with_mask(img, enhanced_img, bg_mask)

        # ── 7. Color — subtle, background-biased ──────────
        color_label = analysis.get("color", {}).get("label", "")
        if color_label == "Dull":
            img = self._subtle_color(img, strength)
            enhancements_applied.append("Subtle Color Boost")

        # ── 8. Final blend with original ──────────────────
        # 75% enhanced, 25% original → preserves authenticity
        if original.shape[:2] != img.shape[:2]:
            original = cv2.resize(original, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_LANCZOS4)
        img = cv2.addWeighted(img, 0.80, original, 0.20, 0)

        # ── Save ──────────────────────────────────────────
        ext = os.path.splitext(output_path)[1].lower()
        if ext in (".jpg", ".jpeg"):
            cv2.imwrite(output_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        elif ext == ".png":
            cv2.imwrite(output_path, img, [cv2.IMWRITE_PNG_COMPRESSION, 3])
        else:
            cv2.imwrite(output_path, img)

        return {"enhancements": enhancements_applied, "mode": mode}



    def _subtle_color(self, img: np.ndarray, strength: float) -> np.ndarray:
        """Very subtle global color vibrance boost using PIL."""
        img_rgb  = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pil_img  = Image.fromarray(img_rgb)
        factor   = 1.03 + 0.07 * strength   # 1.03 to 1.075 (was up to 1.4 before!)
        enhanced = ImageEnhance.Color(pil_img).enhance(factor)
        return cv2.cvtColor(np.array(enhanced), cv2.COLOR_RGB2BGR)


# ═══════════════════════════════════════════════════════════
#  RECOMMENDATION ENGINE
# ═══════════════════════════════════════════════════════════

class RecommendationEngine:
    """Generates smart recommendations from analysis results."""

    def recommend(self, analysis: dict) -> list:
        tips = []
        noise_label      = analysis.get("noise", {}).get("label", "")
        blur_label       = analysis.get("blur", {}).get("label", "")
        brightness_label = analysis.get("brightness", {}).get("label", "")
        contrast_label   = analysis.get("contrast", {}).get("label", "")
        color_label      = analysis.get("color", {}).get("label", "")
        face_count       = analysis.get("faces", {}).get("count", 0)
        res_quality      = analysis.get("resolution", {}).get("quality", "")
        exposure         = analysis.get("histogram", {}).get("exposure", "")

        if face_count > 0:
            tips.append(f"{face_count} face{'s' if face_count > 1 else ''} detected — portrait smoothing applied")

        if noise_label == "High Noise":
            tips.append("Noise reduction applied to clean grain")
        elif noise_label == "Medium Noise":
            tips.append("Edge-preserving denoise applied")

        if res_quality == "Low Quality":
            tips.append("Image upscaled 2x (Lanczos)")

        if brightness_label == "Very Dark" and exposure == "Underexposed":
            tips.append("Minimal brightness lift applied to background only")
        elif brightness_label in ("Dark", "Normal"):
            tips.append("Brightness preserved — no adjustment needed")

        if contrast_label == "Low Contrast":
            tips.append("Background contrast gently enhanced (CLAHE)")

        if color_label == "Dull":
            tips.append("Subtle color vibrance boost applied")

        if noise_label == "Low Noise":
            tips.append("Background detail enhancement applied")

        tips.append("Light global cleanup (edge-preserving filter)")

        return tips


# ═══════════════════════════════════════════════════════════
#  CONVENIENCE: FULL PIPELINE
# ═══════════════════════════════════════════════════════════

def process_image(image_path: str, output_path: str, mode: str = "balanced") -> dict:
    """Full pipeline: analyze → recommend → enhance."""
    analyzer    = ImageAnalyzer()
    enhancer    = ImageEnhancer()
    recommender = RecommendationEngine()

    analysis        = analyzer.analyze(image_path)
    recommendations = recommender.recommend(analysis)
    result          = enhancer.enhance(image_path, output_path, analysis, mode)

    return {
        "analysis":        analysis,
        "recommendations": recommendations,
        "enhancements":    result.get("enhancements", []),
        "mode":            mode,
    }
