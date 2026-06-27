"""
AI Image Enhancer API - Powered by Bytez (caidas/swin2SR-realworld-sr-x4-64-bsrgan-psnr)

Postman setup:
  POST http://localhost:5000/enhance
  Body → form-data → Key: "image" (set type to File) → select your image
  ⚠ Do NOT add a Content-Type header manually — let Postman set it automatically
"""

import base64
import requests
import io
import os
from flask import Flask, request, jsonify, send_file

app = Flask(__name__)

HF_TOKEN = os.getenv("HF_TOKEN") # Get this from https://huggingface.co/settings/tokens
MODEL_ID   = "caidas/swin2SR-realworld-sr-x4-64-bsrgan-psnr"
HF_API_URL = f"https://api-inference.huggingface.co/models/{MODEL_ID}"


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "running", "usage": "POST /enhance — form-data key 'image' (File)"})


@app.route("/enhance", methods=["POST"])
def enhance_image():

    # Accept image from multiple Postman body types
    image_bytes = None

    print("--- NEW REQUEST ---")
    print(f"Content-Type: {request.content_type}")
    print(f"request.files: {request.files}")
    print(f"request.form: {request.form}")
    print(f"request.data length: {len(request.data)}")

    if "image" in request.files:
        # form-data -> Key: image, Type: File  (recommended)
        image_bytes = request.files["image"].read()
    elif len(request.files) > 0:
        # They used a different key name than 'image'
        first_key = list(request.files.keys())[0]
        image_bytes = request.files[first_key].read()
    elif "image" in request.form:
        # form-data -> Key: image, Type: Text (base64 string)
        try:
            image_bytes = base64.b64decode(request.form["image"])
        except Exception:
            return jsonify({"error": "Could not decode base64 string in form field 'image'"}), 400

    elif request.data:
        # Body -> Binary (raw bytes)
        image_bytes = request.data

    else:
        return jsonify({
            "error": "No image received.",
            "fix":   "In Postman: Body -> form-data -> Key='image', change type to 'File', select your image. Do NOT set Content-Type header manually."
        }), 400

    if not image_bytes:
        return jsonify({"error": "Image file is empty."}), 400

    # Call Hugging Face API
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type":  "application/octet-stream"
    }

    print(f"[INFO] Sending image to Hugging Face -> {MODEL_ID}")

    try:
        response = requests.post(HF_API_URL, data=image_bytes, headers=headers, timeout=120)
    except requests.exceptions.Timeout:
        return jsonify({"error": "Hugging Face timed out. Model may be cold-starting — wait 30s and retry."}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Request failed: {str(e)}"}), 502

    if response.status_code != 200:
        return jsonify({
            "error":   "Hugging Face API error",
            "status":  response.status_code,
            "details": response.text
        }), response.status_code

    # Hugging Face returns the enhanced image as raw bytes for image-to-image models
    enhanced_bytes = response.content

    if not enhanced_bytes:
        return jsonify({"error": "Received empty response from Hugging Face"}), 500

    try:
        return send_file(
            io.BytesIO(enhanced_bytes),
            mimetype="image/png",
            as_attachment=True,
            download_name="enhanced_image.png"
        )
    except Exception as e:
        return jsonify({"error": f"Could not process enhanced image: {str(e)}"}), 500


if __name__ == "__main__":
    print("Server running -> http://localhost:5000/enhance")
    if HF_API_KEY == "YOUR_HUGGINGFACE_TOKEN_HERE":
        print("WARNING: Set your HF_API_KEY first! Get it free at https://huggingface.co/settings/tokens")
    app.run(debug=True, host="0.0.0.0", port=5000)