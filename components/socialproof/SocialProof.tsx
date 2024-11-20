import { securityUrl } from "@/config";
import React from "react";

export default function LandingBest({
  color = "text-base-content",
  text = "Security is our top priority",
}) {
  const avatars = [
    "/brands/Vercel.svg",
    "/brands/GCP.svg",
    "/brands/Stripe.jpg",
  ];

  return (
    <div className="space-y-6 text-center pb-6">
      {/* Social Proof Section */}
      <div className="flex items-center space-x-4 justify-center">
        <div className="avatar-group">
          {avatars.map((avatar, index) => (
            <div className="avatar" key={index}>
              <div className="w-8">
                <img src={avatar} alt={`Avatar ${index + 1}`} />
              </div>
            </div>
          ))}
        </div>
        <a
          href={securityUrl}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          <p className={`${color} text-sm text-center font-bold`}>{text}</p>
        </a>
      </div>
    </div>
  );
}
