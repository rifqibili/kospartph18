import asyncio
from playwright.async_api import async_playwright
import os
import sqlite3

async def test_4_1_final_canteen_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        print("--- Testing 4.1 (Final): Operator Canteen Verification ---")

        # Ensure there is a pending payment for a debt order
        conn = sqlite3.connect('database/database.sqlite')
        cursor = conn.cursor()
        # Set order 1 to pending payment with a proof
        cursor.execute("UPDATE canteen_orders SET payment_status = 'pending', payment_proof = 'canteen_payments/dummy.png' WHERE id = 1")
        conn.commit()
        conn.close()

        # Login as Operator (Budi)
        await page.goto("http://localhost:8000/login")
        await page.fill('input[name="email"]', "budi@kospart.com")
        await page.fill('input[name="password"]', "operator123")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard")

        # Go to Kantin Tab
        await page.locator("nav button", has_text="Master Kantin").click()
        await page.wait_for_load_state("networkidle")

        # Find the row in "Daftar Kasbon & Verifikasi"
        # Search for the "Verifikasi TF" button
        print("Finding 'Verifikasi TF' button for canteen order...")
        verify_btn = page.locator("button", has_text="Verifikasi TF").first

        if await verify_btn.is_visible():
            await verify_btn.click()
            print("✅ Clicked Verifikasi TF.")

            # Wait for reload or toast
            await page.wait_for_load_state("networkidle")

            # Verify in DB
            conn = sqlite3.connect('database/database.sqlite')
            cursor = conn.cursor()
            cursor.execute("SELECT payment_status FROM canteen_orders WHERE id = 1")
            status = cursor.fetchone()[0]
            conn.close()
            print(f"Canteen order 1 payment status: {status}")
            if status == 'paid':
                print("✅ Debt successfully verified and marked as Paid.")
            else:
                print(f"❌ Verification failed. Status is {status}")
        else:
            print("❌ 'Verifikasi TF' button NOT found.")
            await page.screenshot(path="verification/screenshots/error_4_1_final.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_4_1_final_canteen_verification())
