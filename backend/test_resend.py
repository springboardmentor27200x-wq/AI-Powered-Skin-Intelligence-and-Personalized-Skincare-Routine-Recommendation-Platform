import asyncio
import os
import resend
from dotenv import load_dotenv

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

async def test():
    try:
        response = await resend.Emails.send_async({
            "from": "onboarding@resend.dev",
            "to": ["virjasurve9@gmail.com"],
            "subject": "SkinSense email test",
            "html": "<h1>SkinSense email verification test</h1>"
        })
        print("SUCCESS:", response)
    except Exception as e:
        print("FAILED:", repr(e))

asyncio.run(test())
