export const printContent = (element, title = 'Document') => {
    if (!element) {
        console.error("Print element not found");
        return;
    }

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // Get all stylesheets and style tags
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(node => node.cloneNode(true).outerHTML)
        .join('');

    // Write content
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            ${styles}
            <style>
                body { 
                    margin: 0; 
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact;
                }
                @media print {
                    @page { size: auto; margin: 0mm; }
                    .print-hidden { display: none !important; }
                }
            </style>
        </head>
        <body>
            ${element.outerHTML}
            <script>
                // Wait for styles/images to load roughly
                window.onload = () => {
                   // Small delay to ensure rendering
                   setTimeout(() => {
                        window.focus();
                        window.print();
                        // Cleanup after print dialog usage (approximate)
                        // Note: cannot detect cancel/print reliably across browsers, but we can remove iframe later
                   }, 500);
                };
            </script>
        </body>
        </html>
    `);
    doc.close();

    // Remove iframe after a delay (printing blocks JS execution usually, so this runs after)
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 2000);
};
