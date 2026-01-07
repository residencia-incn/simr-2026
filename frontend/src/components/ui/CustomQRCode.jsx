import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * CustomQRCode - QR Code with SIMR 2026 logo in the center
 * @param {string} value - Data to encode in QR
 * @param {number} size - Size of QR code in pixels
 * @param {string} level - Error correction level: 'L', 'M', 'Q', 'H'
 */
const CustomQRCode = ({ value, size = 200, level = 'H' }) => {
    const logoSize = size * 0.25; // Logo takes 25% of QR size
    const logoPosition = (size - logoSize) / 2;

    return (
        <div className="relative inline-block" style={{ width: size, height: size }}>
            {/* QR Code */}
            <QRCodeSVG
                value={value}
                size={size}
                level={level}
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#000000"
            />

            {/* Center Logo Circle */}
            <div
                className="absolute bg-white rounded-full flex items-center justify-center shadow-lg"
                style={{
                    width: logoSize,
                    height: logoSize,
                    top: logoPosition,
                    left: logoPosition
                }}
            >
                <div className="text-center">
                    <div className="font-bold text-black leading-tight" style={{ fontSize: logoSize * 0.28 }}>
                        SIMR
                    </div>
                    <div className="font-bold text-black leading-tight" style={{ fontSize: logoSize * 0.24 }}>
                        2026
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomQRCode;
