import asyncio
from playwright.async_api import async_playwright
import os
import sqlite3

async def test_5_notifications():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        print("--- Testing 5.1: Notifications (Bell Icon) ---")

        # Simulation: Create a new complaint to trigger a notification for Admin
        conn = sqlite3.connect('database/database.sqlite')
        cursor = conn.cursor()
        # Resident Dani (ID 4), Room 1 (No 101)
        cursor.execute("""
            INSERT INTO complaints (tenant_id, room_id, title, description, status, created_at, updated_at)
            VALUES (4, 1, 'NOTIF TEST', 'Testing notification system', 'pending', datetime('now'), datetime('now'))
        """)
        conn.commit()
        conn.close()

        # Login as Super Admin
        await page.goto("http://localhost:8000/login")
        await page.fill('input[name="email"]', "admin@kospart.com")
        await page.fill('input[name="password"]', "admin123")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard")

        # Check Bell Icon Badge
        print("Checking bell icon for notification badge...")
        bell_btn = page.locator('header button:has(svg path[d*="M15 17h5"])')
        badge = bell_btn.locator('span.bg-red-500')

        # Click Bell Icon
        await bell_btn.click()

        # Check specific notification content
        try:
            # Dropdown should open
            # Let's wait specifically for the element to appear after click
            await page.wait_for_selector(".absolute.right-0.top-12", timeout=5000)
            print("Notification dropdown opened.")

            await page.wait_for_selector("text=NOTIF TEST", timeout=5000)
            print("✅ Specific notification 'NOTIF TEST' found in dropdown.")
        except:
            print("❌ Notification NOT found in dropdown.")
            # Take screenshot for debugging
            await page.screenshot(path="verification/screenshots/error_5_1_dropdown.png")
            # Check if dropdown is even there
            dropdown = await page.query_selector(".absolute.right-0.top-12")
            if dropdown:
                notif_list = await dropdown.inner_text()
                print("Notifications visible in dropdown:")
                print(notif_list)
            else:
                print("Dropdown container NOT FOUND.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_5_notifications())
