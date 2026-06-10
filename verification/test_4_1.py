import asyncio
from playwright.async_api import async_playwright
import os
import sqlite3

async def test_4_1_canteen_kasbon_v2():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        print("--- Testing 4.1: Resident Canteen & Kasbon ---")

        # Ensure "Indomie Telur" exists in DB for branch 1 (Utama)
        conn = sqlite3.connect('database/database.sqlite')
        cursor = conn.cursor()
        cursor.execute("DELETE FROM canteen_items WHERE name = 'Indomie Telur'")
        cursor.execute("INSERT INTO canteen_items (branch_id, name, category, price, stock, is_sellable) VALUES (1, 'Indomie Telur', 'food', 10000, 10, 1)")
        conn.commit()
        conn.close()

        # Login as Resident (Dani Trisna - dani@gmail.com / tenant123)
        await page.goto("http://localhost:8000/login")
        await page.fill('input[name="email"]', "dani@gmail.com")
        await page.fill('input[name="password"]', "tenant123")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/kamar")

        await page.goto("http://localhost:8000/dashboard")

        # Open Canteen Tab
        await page.locator("nav button", has_text="Kantin Kos").click()
        await page.wait_for_load_state("networkidle")

        # Search Indomie
        print("Testing canteen search filter...")
        search_input = page.locator('input[placeholder="Cari menu..."]')
        await search_input.fill("Indomie")

        # Check if Indomie Telur is visible
        try:
            await page.wait_for_selector("text=Indomie Telur", timeout=5000)
            print("✅ Search filter works: Indomie Telur found.")
        except:
            print("❌ Search filter failed: Indomie Telur NOT found.")
            await page.screenshot(path="verification/screenshots/error_4_1_search.png")

        # Order via Kasbon
        print("Ordering Indomie Telur via Kasbon...")
        await page.click("button:has-text('+ Tambah')")
        await page.click("button:has-text('Checkout Pesanan')")

        # In Checkout Modal
        await page.select_option('select:has-text("Transfer / QRIS")', label="Catat Dulu (Kasbon)")
        await page.click("button:has-text('Pesan Sekarang')")

        # Force high debt for warning
        print("Forcing high debt for warning...")
        conn = sqlite3.connect('database/database.sqlite')
        cursor = conn.cursor()
        cursor.execute("UPDATE canteen_orders SET total_amount = 150000 WHERE tenant_id = 4 AND payment_status = 'debt_unpaid'")
        conn.commit()
        # Verify debt in DB
        cursor.execute("SELECT SUM(total_amount) FROM canteen_orders WHERE tenant_id = 4 AND payment_status = 'debt_unpaid'")
        debt = cursor.fetchone()[0]
        print(f"Total debt in DB: {debt}")
        conn.close()

        await page.reload()
        await page.locator("nav button", has_text="Kantin Kos").click()

        try:
            await page.wait_for_selector("text=Peringatan: Utang Kantin Menumpuk", timeout=5000)
            print("✅ Debt warning visible for high debt.")
        except:
            print("❌ Debt warning NOT visible.")
            await page.screenshot(path="verification/screenshots/error_4_1_warning.png")

        # Step: Pay Debt (Bayar Utang)
        print("Testing Debt Repayment...")
        await page.click("button:has-text('Lunasi Semua Kasbon')")

        # Upload fake proof
        with open("fake_qris.png", "wb") as f: f.write(b"fake image")
        await page.set_input_files('input[type="file"]', "fake_qris.png")
        await page.click("button:has-text('Ajukan Pelunasan')")

        # Verify status in DB (should be 'pending' with payment proof)
        conn = sqlite3.connect('database/database.sqlite')
        cursor = conn.cursor()
        cursor.execute("SELECT payment_status, payment_proof FROM canteen_orders WHERE tenant_id = 4 AND payment_status = 'pending' ORDER BY created_at DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        if row:
            print(f"✅ Order status is {row[0]}, proof path: {row[1]}")
        else:
            print("❌ Pending repayment order NOT found in DB.")

        await browser.close()
        if os.path.exists("fake_qris.png"): os.remove("fake_qris.png")

if __name__ == "__main__":
    asyncio.run(test_4_1_canteen_kasbon_v2())
