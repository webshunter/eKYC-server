const { PythonShell } = require('python-shell');
const fs = require('fs');
const path = require('path');

class PaddleOCRService {
    constructor() {
        this.pythonScript = path.join(__dirname, 'paddleocr_ktp.py');
        this.setupPythonScript();
    }

    setupPythonScript() {
        const pythonCode = `
import sys
import json
import base64
import cv2
import numpy as np
from paddleocr import PaddleOCR
import os

def process_ktp_image(image_base64):
    try:
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"error": "Invalid image data"}
        
        # Initialize PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)
        
        # Perform OCR
        result = ocr.ocr(img, cls=True)
        
        # Extract text from results
        extracted_text = []
        for line in result:
            for word_info in line:
                text = word_info[1][0]  # Get the text
                confidence = word_info[1][1]  # Get confidence score
                extracted_text.append({
                    "text": text,
                    "confidence": float(confidence)
                })
        
        # Parse KTP specific fields
        ktp_data = parse_ktp_data(extracted_text)
        
        return {
            "success": True,
            "raw_text": extracted_text,
            "ktp_data": ktp_data
        }
        
    except Exception as e:
        return {"error": str(e)}

def parse_ktp_data(text_list):
    """Parse KTP specific fields from OCR results"""
    ktp_data = {
        "nik": "",
        "nama": "",
        "tempat_lahir": "",
        "tanggal_lahir": "",
        "jenis_kelamin": "",
        "alamat": "",
        "rt_rw": "",
        "kelurahan": "",
        "kecamatan": "",
        "agama": "",
        "status_perkawinan": "",
        "pekerjaan": "",
        "kewarganegaraan": "",
        "berlaku_hingga": ""
    }
    
    # Join all text for easier searching
    full_text = " ".join([item["text"] for item in text_list])
    
    # Extract NIK (16 digits)
    import re
    nik_match = re.search(r'\\b\\d{16}\\b', full_text)
    if nik_match:
        ktp_data["nik"] = nik_match.group()
    
    # Extract other fields based on common patterns
    for item in text_list:
        text = item["text"].upper()
        
        # Nama
        if "NAMA" in text or "Nama" in text:
            # Look for name in next few items
            pass
        
        # Tempat/Tanggal Lahir
        if "LAHIR" in text:
            # Extract birth info
            pass
        
        # Jenis Kelamin
        if "LAKI-LAKI" in text or "PEREMPUAN" in text:
            ktp_data["jenis_kelamin"] = text
        
        # Alamat
        if "ALAMAT" in text:
            # Extract address
            pass
    
    return ktp_data

if __name__ == "__main__":
    # Read input from stdin
    input_data = sys.stdin.read()
    try:
        data = json.loads(input_data)
        image_base64 = data.get("imageBase64", "")
        
        if not image_base64:
            print(json.dumps({"error": "No image data provided"}))
            sys.exit(1)
        
        result = process_ktp_image(image_base64)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
`;
        
        fs.writeFileSync(this.pythonScript, pythonCode);
    }

    async processKTPImage(imageBase64) {
        return new Promise((resolve, reject) => {
            const options = {
                mode: 'json',
                pythonPath: 'python3',
                pythonOptions: ['-u'], // unbuffered output
                scriptPath: __dirname,
                args: []
            };

            const pyshell = new PythonShell('paddleocr_ktp.py', options);
            
            let result = '';
            
            pyshell.on('message', function (message) {
                result = message;
            });
            
            pyshell.end(function (err) {
                if (err) {
                    reject(err);
                } else {
                    try {
                        const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
                        resolve(parsedResult);
                    } catch (parseError) {
                        reject(parseError);
                    }
                }
            });
            
            // Send input data
            pyshell.send(JSON.stringify({ imageBase64 }));
        });
    }
}

module.exports = PaddleOCRService; 