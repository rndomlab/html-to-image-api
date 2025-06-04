const { chromium } = require('playwright-core');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the HTML and dimensions from the request
    const { html, width = 1080, height = 1080 } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('Starting browser...');
    
    // Launch a headless browser
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set the page size
    await page.setViewportSize({ 
      width: parseInt(width), 
      height: parseInt(height) 
    });

    console.log('Setting HTML content...');
    
    // Load the HTML content
    await page.setContent(html, { 
      waitUntil: 'networkidle'
    });

    // Wait for fonts and rendering
    await page.waitForTimeout(3000);

    console.log('Taking screenshot...');
    
    // Take the screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: parseInt(width),
        height: parseInt(height)
      }
    });

    await browser.close();

    // Convert to base64 and return
    const base64Image = screenshot.toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;

    console.log('Screenshot completed successfully');

    res.status(200).json({
      url: imageUrl,
      success: true
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate screenshot',
      details: error.message 
    });
  }
};
