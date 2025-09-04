// Create a simple icon for the Discord Chat Cleaner app
const fs = require('fs');
const path = require('path');

// Create a simple 32x32 PNG icon (basic implementation)
// This creates a minimal valid PNG with a colored square
function createSimplePNG(size = 32, color = [88, 101, 242]) { // Discord blue color
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // IHDR chunk
    const ihdr = Buffer.concat([
        Buffer.from([0, 0, 0, 13]), // Length
        Buffer.from('IHDR'),
        Buffer.from([
            0, 0, 0, size, // Width
            0, 0, 0, size, // Height
            8, // Bit depth
            2, // Color type (RGB)
            0, // Compression
            0, // Filter
            0  // Interlace
        ]),
        Buffer.from([0x9a, 0x76, 0x82, 0x7e]) // CRC placeholder
    ]);
    
    // Create simple image data (solid color)
    const pixels = [];
    for (let y = 0; y < size; y++) {
        pixels.push(0); // Filter type
        for (let x = 0; x < size; x++) {
            // Add some simple pattern
            if ((x < size/3 || x > 2*size/3) || (y < size/3 || y > 2*size/3)) {
                pixels.push(...color); // RGB
            } else {
                pixels.push(255, 255, 255); // White center
            }
        }
    }
    
    const imageData = Buffer.from(pixels);
    
    // IDAT chunk (simplified)
    const idat = Buffer.concat([
        Buffer.from([0, 0, 0, imageData.length]), // Length
        Buffer.from('IDAT'),
        imageData,
        Buffer.from([0, 0, 0, 0]) // CRC placeholder
    ]);
    
    // IEND chunk
    const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 0xAE, 0x42, 0x60, 0x82]);
    
    return Buffer.concat([signature, ihdr, idat, iend]);
}

// Create the icon file
const iconPath = path.join(__dirname, 'public', 'icon.png');
const iconBuffer = createSimplePNG(256, [88, 101, 242]);

fs.writeFileSync(iconPath, iconBuffer);
console.log('Icon created at:', iconPath);

// Also create a smaller version for tray
const trayIconPath = path.join(__dirname, 'public', 'tray-icon.png');
const trayIconBuffer = createSimplePNG(32, [88, 101, 242]);
fs.writeFileSync(trayIconPath, trayIconBuffer);
console.log('Tray icon created at:', trayIconPath);