from main import app
import sys

print("--- ROUTES ---")
for route in app.routes:
    print(route.path)
print("--- END ROUTES ---")
