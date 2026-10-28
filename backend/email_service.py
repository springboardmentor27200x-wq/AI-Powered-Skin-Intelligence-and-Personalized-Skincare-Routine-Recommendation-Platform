import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")


async def send_verification_email(
    recipient_email: str,
    verification_link: str
):
    params: resend.Emails.SendParams = {
        "from": "onboarding@resend.dev",        "to": [recipient_email],
        "subject": "Verify your SkinSense account ✨",
        "html": f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h1>Welcome to SkinSense ✨</h1>

            <p>Thanks for creating your SkinSense account.</p>

            <p>
                Please verify your email address by clicking the button below:
            </p>

            <a
                href="{verification_link}"
                style="
                    display: inline-block;
                    padding: 12px 20px;
                    background: #c9a7b5;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                "
            >
                Verify My Email
            </a>

            <p style="margin-top: 25px; color: #777;">
                This verification link will expire in 30 minutes.
            </p>

            <p style="color: #777;">
                If you didn't create a SkinSense account, you can ignore this email.
            </p>
        </div>
        """
    }

    return await resend.Emails.send_async(params)