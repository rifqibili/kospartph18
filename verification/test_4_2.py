import asyncio
from playwright.async_api import async_playwright
import os
import sqlite3
from datetime import datetime, timedelta

async def test_4_2_lease_status():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        print("--- Testing 4.2: Lease Status & Progress ---")

        # Simulation: Set end date to < 3 days from now for Dani Trisna (ID 4)
        conn = sqlite3.connect('database/database.sqlite')
        cursor = conn.cursor()

        near_expiry = (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d %H:%M:%S')
        # Ensure only one active booking for Dani to avoid confusion
        cursor.execute("UPDATE bookings SET status = 'completed' WHERE tenant_id = 4")
        cursor.execute("""
            UPDATE bookings
            SET status = 'active', end_date = ?, total_amount = 1000000, paid_amount = 500000, payment_status = 'dp'
            WHERE id = (SELECT id FROM bookings WHERE tenant_id = 4 LIMIT 1)
        """, (near_expiry,))
        conn.commit()
        conn.close()

        # Login
        await page.goto("http://localhost:8000/login")
        await page.fill('input[name="email"]', "dani@gmail.com")
        await page.fill('input[name="password"]', "tenant123")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/kamar")

        await page.goto("http://localhost:8000/dashboard")
        await page.wait_for_load_state("networkidle")

        # Check Progress Bar
        print("Checking payment progress bar...")
        # The text "50%" should be visible in the progress section
        try:
            await page.wait_for_selector("text=50%", timeout=5000)
            print("✅ Payment progress accurately shows 50%.")
        except:
            print("❌ Payment progress incorrect or not found.")
            await page.screenshot(path="verification/screenshots/error_4_2_progress.png")

        # Check Expiry Warning
        print("Checking lease expiry warning...")
        try:
            # Look for "2 hari lagi"
            expiry_text = page.locator("text=2 hari lagi")
            await expiry_text.wait_for(timeout=5000)
            print("✅ Expiry info '2 hari lagi' is visible.")

            # Check for red color class in parent
            parent = expiry_text.locator("xpath=..")
            classes = await parent.get_attribute("class")
            if "text-red-600" in classes:
                print("✅ Warning color (Red) is correctly applied.")
            else:
                print(f"❌ Warning color NOT applied. Classes: {classes}")
        except:
            print("❌ Expiry info not found.")
            await page.screenshot(path="verification/screenshots/error_4_2_expiry.png")

        await browser.close()

if __name__ == "__main__":
    os.makedirs("verification/screenshots", exist_ok=True)
    asyncio.run(test_4_2_lease_status())
