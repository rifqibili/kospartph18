import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    base_url = os.getenv("APP_URL", "http://localhost:8000")
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        print(f"Navigating to home page at {base_url}...")
        await page.goto(base_url)
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path="verification/screenshots/home_updated.png")

        # Check if "Cari Kamar" link exists, use first one to avoid strict mode violation
        cari_kamar_link = page.get_by_role("link", name="Cari Kamar").first
        if await cari_kamar_link.is_visible():
            print("Found 'Cari Kamar' link")
            await cari_kamar_link.click()
            await page.wait_for_load_state("networkidle")
            print(f"Navigated to: {page.url}")
            await page.screenshot(path="verification/screenshots/kamar_page.png")
        else:
            print("'Cari Kamar' link not found, trying hero button")
            pesan_kamar_btn = page.get_by_role("link", name="Pesan Kamar Sekarang")
            await pesan_kamar_btn.click()
            await page.wait_for_load_state("networkidle")
            print(f"Navigated to: {page.url}")
            await page.screenshot(path="verification/screenshots/kamar_page_hero.png")

        # Test Registration
        print("Testing Registration Flow...")
        await page.goto(f"{base_url}/register")
        await page.fill('input[name="name"]', 'Frontend Tester')
        await page.fill('input[name="email"]', 'frontend@tester.com')
        await page.fill('input[name="phone"]', '081234567890')
        await page.fill('input[name="password"]', 'password123')
        await page.fill('input[name="password_confirmation"]', 'password123')
        await page.click('button[type="submit"]')

        await page.wait_for_load_state("networkidle")
        print(f"After registration redirect: {page.url}")
        await page.screenshot(path="verification/screenshots/after_register.png")

        # Test Login
        print("Testing Login Flow...")
        await page.goto(f"{base_url}/login")
        # Email field in Login actually accepts Email or No. WA
        await page.fill('input[name="email"]', 'frontend@tester.com')
        await page.fill('input[name="password"]', 'password123')
        await page.click('button[type="submit"]')

        await page.wait_for_load_state("networkidle")
        print(f"After login redirect: {page.url}")
        await page.screenshot(path="verification/screenshots/after_login.png")

        if "/kamar" in page.url or "/dashboard" in page.url:
            print("Login successful!")
        else:
            print("Login might have failed or redirected elsewhere.")

        await browser.close()

if __name__ == "__main__":
    os.makedirs("verification/screenshots", exist_ok=True)
    asyncio.run(run())
