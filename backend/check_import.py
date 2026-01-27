import sys
import os
sys.path.append(os.getcwd())
try:
    from routers import planning
    print("Import successful")
except Exception as e:
    print(e)
