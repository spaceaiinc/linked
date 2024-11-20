import InputCapture from "@/components/input/Input";
import PaymentModal from "@/components/paywall/Payment";
import { createClient } from "@/lib/utils/supabase/server";
import { toolConfig } from "../toolConfig";
import { redirect } from "next/navigation";
import AppInfo from "@/components/input/AppInfo";
import { AnimatedBeamOpenAI } from "@/components/magicui/animated-beam-bi-directional";
import { IconOpenAI } from "@/components/icons";
import { GearIcon, Link1Icon, PaddingIcon } from "@radix-ui/react-icons";
import { Database } from "lucide-react";
import { UserGenerations } from "@/components/dashboard/UserTextGenerations";

export const metadata = {
  title: toolConfig.metadata.title,
  description: toolConfig.metadata.description,
  openGraph: {
    images: [toolConfig.metadata.og_image],
  },
  alternates: {
    canonical: toolConfig.metadata.canonical,
  },
};
export default async function Page() {
  // Verify that user is logged in
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // if (!user) {
  //   return redirect("/auth");
  // }

  // If user is logged in, we check if the tool is paywalled.
  // If it is, we check if the user has a valid purchase & enough credits for one generation
  let credits;
  let generations = [];

  if (user) {
    if (toolConfig.paywall) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      credits = profile.credits;

      console.table(profile);

      if (credits < toolConfig.credits) {
        return <PaymentModal />;
      }
    }

    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("email", user.email)
      .ilike("type", "%claude%")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching generations:", error);
    } else {
      generations = data;
    }
  }

  const InfoCard = (
    <AppInfo
      title="Claude 3.5 Sonnet text generator demo application"
      background="bg-primary/5"
    >
      <div className="py-8 flex justify-center">
        <AnimatedBeamOpenAI />
      </div>
      {/* <Info>
        Have a look{" "}
        <a
          href="https://docs.spaceai.jp/ai/claude"
          target="_blank"
          className="font-semibold underline"
        >
          at the documentation
        </a>{" "}
        for more information on setting up the app.
      </Info> */}
      <ul className="mt-4 ml-4 text-sm space-y-2 flex flex-col mb-4 relative xs:leading-7">
        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <IconOpenAI className="w-4 h-4" />
          </span>
          <span className="ml-2">
            This demo application uses LangChain and Claude 3 to return
            structured JSON output.
          </span>
        </li>
        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <Database className="w-4 h-4" />
          </span>
          <span className="ml-2">
            Response is stored in the <code>generations</code> table in Supabase
            and linked to the user for easy access.
          </span>
        </li>

        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <PaddingIcon className="w-4 h-4" />
          </span>

          <span className="ml-2">
            The main frontend logic is found in the{" "}
            <code>app/(apps)/claude</code> folder. You'll find the prompts,
            configuration file and the JSON schema here.
          </span>
        </li>
        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <GearIcon className="w-4 h-4" />
          </span>

          <span className="ml-2">
            The main configuration file can be found in{" "}
            <code>app/(apps)/claude/toolConfig.ts</code> file.
          </span>
        </li>

        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <Link1Icon className="w-4 h-4" />
          </span>

          <span className="ml-2">
            The API endpoint and logic can be found in{" "}
            <code>app/api/(apps)/claude/route.ts</code>.
          </span>
        </li>
      </ul>
    </AppInfo>
  );

  // If the tool is not paywalled or the user has a valid purchase, render the page
  return (
    <div data-theme={toolConfig.company.theme} className="bg-white">
      <InputCapture
        toolConfig={toolConfig}
        userEmail={user ? user.email : undefined}
        credits={toolConfig.paywall ? credits : undefined}
        emptyStateComponent={InfoCard}
      />
      <UserGenerations generations={generations} generationType="claude" />
    </div>
  );
}
