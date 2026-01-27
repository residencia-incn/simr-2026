try:
    from main import app
    print("Syntax checks out. App imported successfully.")
except Exception as e:
    print(f"Error importing app: {e}")
    import traceback
    traceback.print_exc()
