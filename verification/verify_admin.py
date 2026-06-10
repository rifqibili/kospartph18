import asyncio
from playwright.async_api import async_playwright
import os

async def verify_admin_dashboard():
    base_url = os.getenv("APP_URL", "http://localhost:8000")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@kospart.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        print(f"Navigating to login page at {base_url}...")
        await page.goto(f"{base_url}/login")

        print(f"Logging in as Super Admin ({admin_email})...")
        await page.fill('input[name="email"]', admin_email)
        await page.fill('input[name="password"]', admin_password)

        # Click and wait for navigation
        async with page.expect_navigation():
            await page.click('button[type="submit"]')

        print(f"Current URL after login attempt: {page.url}")

        if "/dashboard" in page.url:
            print("Successfully reached dashboard.")
        else:
            print("Failed to reach dashboard.")
            # Check for validation errors
            errors = await page.query_selector_all(".text-red-600")
            for error in errors:
                print(f"Error found: {await error.inner_text()}")

        # Take a screenshot of the dashboard
        await page.screenshot(path="verification/screenshots/admin_dashboard.png")
        print("Admin dashboard screenshot saved.")

        # Check for some dashboard elements
        await page.wait_for_selector("text=Ringkasan Dashboard")
        await page.wait_for_selector("text=Kamar Tersedia")

        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification/screenshots"):
        os.makedirs("verification/screenshots")
    asyncio.run(verify_admin_dashboard())
