const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class TesseractOCRService {
    constructor() {
        this.tempDir = path.join(__dirname, 'temp');
        this.ensureTempDir();
    }

    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async processKTPImage(imageBase64) {
        try {
            // Decode base64 to image file
            const imageBuffer = Buffer.from(imageBase64, 'base64');
            const imagePath = path.join(this.tempDir, `ktp_${Date.now()}.png`);
            const outputPath = path.join(this.tempDir, `ktp_${Date.now()}_output`);

            // Save image to file
            fs.writeFileSync(imagePath, imageBuffer);

            // Run Tesseract OCR
            const result = await this.runTesseract(imagePath, outputPath);

            // Clean up temp files
            this.cleanupTempFiles(imagePath, outputPath);

            return result;

        } catch (error) {
            console.error('Tesseract OCR Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    runTesseract(imagePath, outputPath) {
        return new Promise((resolve, reject) => {
            // Tesseract command with Indonesian language and specific config for ID cards
            const command = `tesseract "${imagePath}" "${outputPath}" -l ind+eng --oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -c tessedit_char_blacklist=|`;

            exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Tesseract execution error:', error);
                    reject(error);
                    return;
                }

                try {
                    // Read the output text file
                    const textOutputPath = `${outputPath}.txt`;
                    if (fs.existsSync(textOutputPath)) {
                        const text = fs.readFileSync(textOutputPath, 'utf8');
                        const parsedData = this.parseKTPData(text);
                        
                        resolve({
                            success: true,
                            rawText: text,
                            ktpData: parsedData
                        });
                    } else {
                        reject(new Error('Tesseract output file not found'));
                    }
                } catch (readError) {
                    reject(readError);
                }
            });
        });
    }

    parseKTPData(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const fullText = text.toUpperCase();
        
        const ktpData = {
            nik: '',
            nama: '',
            tempat_lahir: '',
            tanggal_lahir: '',
            jenis_kelamin: '',
            alamat: '',
            rt_rw: '',
            kelurahan: '',
            kecamatan: '',
            agama: '',
            status_perkawinan: '',
            pekerjaan: '',
            kewarganegaraan: '',
            berlaku_hingga: ''
        };

        // Extract NIK (16 digits)
        const nikMatch = fullText.match(/\b\d{16}\b/);
        if (nikMatch) {
            ktpData.nik = nikMatch[0];
        }

        // Extract other fields using pattern matching
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toUpperCase().trim();
            
            // Nama
            if (line.includes('NAMA') || line.includes('Nama')) {
                if (i + 1 < lines.length) {
                    ktpData.nama = lines[i + 1].trim();
                }
            }
            
            // Tempat/Tanggal Lahir
            if (line.includes('LAHIR')) {
                const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
                if (nextLine) {
                    // Try to extract place and date
                    const parts = nextLine.split(',');
                    if (parts.length >= 2) {
                        ktpData.tempat_lahir = parts[0].trim();
                        ktpData.tanggal_lahir = parts[1].trim();
                    } else {
                        ktpData.tempat_lahir = nextLine;
                    }
                }
            }
            
            // Jenis Kelamin
            if (line.includes('LAKI-LAKI') || line.includes('PEREMPUAN')) {
                ktpData.jenis_kelamin = line;
            }
            
            // Alamat
            if (line.includes('ALAMAT')) {
                let address = '';
                for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                    const addrLine = lines[j].trim();
                    if (addrLine && !addrLine.includes('RT/RW') && !addrLine.includes('KEL/DESA')) {
                        address += addrLine + ' ';
                    }
                }
                ktpData.alamat = address.trim();
            }
            
            // RT/RW
            if (line.includes('RT/RW') || line.includes('RT/')) {
                const rtRwMatch = line.match(/(\d{1,3})[/-](\d{1,3})/);
                if (rtRwMatch) {
                    ktpData.rt_rw = `${rtRwMatch[1]}/${rtRwMatch[2]}`;
                }
            }
            
            // Kelurahan
            if (line.includes('KEL/DESA') || line.includes('KELURAHAN')) {
                if (i + 1 < lines.length) {
                    ktpData.kelurahan = lines[i + 1].trim();
                }
            }
            
            // Kecamatan
            if (line.includes('KECAMATAN')) {
                if (i + 1 < lines.length) {
                    ktpData.kecamatan = lines[i + 1].trim();
                }
            }
            
            // Agama
            if (line.includes('AGAMA')) {
                if (i + 1 < lines.length) {
                    ktpData.agama = lines[i + 1].trim();
                }
            }
            
            // Status Perkawinan
            if (line.includes('PERKAWINAN') || line.includes('STATUS')) {
                if (i + 1 < lines.length) {
                    ktpData.status_perkawinan = lines[i + 1].trim();
                }
            }
            
            // Pekerjaan
            if (line.includes('PEKERJAAN')) {
                if (i + 1 < lines.length) {
                    ktpData.pekerjaan = lines[i + 1].trim();
                }
            }
            
            // Kewarganegaraan
            if (line.includes('KEWARGANEGARAAN')) {
                if (i + 1 < lines.length) {
                    ktpData.kewarganegaraan = lines[i + 1].trim();
                }
            }
            
            // Berlaku Hingga
            if (line.includes('BERLAKU') || line.includes('HINGGA')) {
                if (i + 1 < lines.length) {
                    ktpData.berlaku_hingga = lines[i + 1].trim();
                }
            }
        }

        return ktpData;
    }

    cleanupTempFiles(imagePath, outputPath) {
        try {
            // Remove image file
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
            
            // Remove output files
            const textOutputPath = `${outputPath}.txt`;
            if (fs.existsSync(textOutputPath)) {
                fs.unlinkSync(textOutputPath);
            }
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }

    async checkTesseractAvailability() {
        return new Promise((resolve) => {
            exec('tesseract --version', (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        available: false,
                        error: error.message
                    });
                } else {
                    resolve({
                        available: true,
                        version: stdout.trim()
                    });
                }
            });
        });
    }
}

module.exports = TesseractOCRService; 