import asyncio
from playwright.async_api import async_playwright
import os
import sqlite3

async def test_4_3_invoice_extend():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        print("--- Testing 4.3: Invoice & Extension ---")

        # Login
        await page.goto("http://localhost:8000/login")
        await page.fill('input[name="email"]', "dani@gmail.com")
        await page.fill('input[name="password"]', "tenant123")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/kamar")

        await page.goto("http://localhost:8000/dashboard")

        # Invoice
        print("Testing Invoice Preview...")
        await page.click("button:has-text('Invoice')")
        await page.wait_for_selector("text=Nota Invoice Tagihan Kos")
        print("✅ Invoice modal opened.")
        await page.click("button:has-text('Tutup Invoice')")

        # Extension
        print("Testing Lease Extension...")
        # Get current end_date
        conn = sqlite3.connect('database/database.sqlite')
        cursor = conn.cursor()
        cursor.execute("SELECT end_date FROM bookings WHERE tenant_id = 4 AND status = 'active' LIMIT 1")
        old_end_date = cursor.fetchone()[0]
        conn.close()
        print(f"Current end date: {old_end_date}")

        await page.click("button:has-text('Perpanjang')")
        await page.fill('input[type="number"]', "1")
        await page.click("button:has-text('Konfirmasi Perpanjangan')")

        # Wait for toast or refresh
        await page.wait_for_load_state("networkidle")

        # Verify in DB
        conn = sqlite3.connect('database/database.sqlite')
        cursor = conn.cursor()
        cursor.execute("SELECT end_date FROM bookings WHERE tenant_id = 4 AND status = 'active' LIMIT 1")
        new_end_date = cursor.fetchone()[0]
        conn.close()
        print(f"New end date: {new_end_date}")

        if new_end_date > old_end_date:
            print("✅ Lease successfully extended.")
        else:
            print("❌ Lease extension failed.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_4_3_invoice_extend())
