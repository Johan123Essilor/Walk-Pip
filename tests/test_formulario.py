from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time


# ============================
#  Test completo del formulario
# ============================

def test_formulario():

    # Inicializar navegador SIN driver manual
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

    try:
        # 1. Abrir la página del formulario
        driver.get("http://localhost:8000/form")   # <-- Cambia por tu URL real

        # 2. Buscar inputs
        username_input = driver.find_element(By.ID, "username")
        email_input = driver.find_element(By.ID, "email")
        submit_btn = driver.find_element(By.ID, "submit-btn")

        # 3. Escribir en los inputs
        username_input.send_keys("Angel")
        email_input.send_keys("angel@example.com")

        # 4. Presionar submit
        submit_btn.click()

        # 5. Esperar un momento para que cargue la nueva página
        time.sleep(2)

        # 6. Comprobar que todo salió bien (cambio de URL o mensaje)
        if "success" in driver.current_url:
            print("✅ Test OK — La URL indica que se envió correctamente.")
        else:
            print("⚠️ No cambió la URL. Buscando mensaje de éxito...")

            try:
                success_msg = driver.find_element(
                    By.XPATH, "//*[contains(text(),'Success')]")
                print("✅ Test OK — Apareció el mensaje de éxito.")
            except:
                print("❌ Test FALLÓ — No hubo URL de éxito ni mensaje.")
    finally:
        time.sleep(2)
        driver.quit()


# Ejecutar el test cuando hagas: python test_formulario.py
if __name__ == "__main__":
    test_formulario()
