const BASE = "http://localhost:3000";

async function testReplies() {
  const res = await fetch(`${BASE}/api/ai/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: "gmail",
      tone: "friendly",
      messages: [
        { sender: "them", text: "Hey, can you send me the Q3 report?" },
        { sender: "me", text: "Sure, I'll have it ready by Friday." },
        { sender: "them", text: "Thanks! Also, could you include the revenue breakdown?" }
      ]
    })
  });
  console.log("Status:", res.status);
  console.log("Response:", await res.json());
}

testReplies().catch(console.error);
