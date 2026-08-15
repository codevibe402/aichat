(() =>
    
    { var a = "https://aichat-9bwl.onrender.com"; 
        async function o() { 
            try { 
                let t = await chrome.identity.getAuthToken({ interactive: !0 });
                 if (!t) return null; 
                 let e = await (await fetch(`${a}/api/auth/google`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: t }) })).json(); 
                 if (e.signedIn) return await chrome.storage.local.set({ msgmate_auth_status: { signedIn: !0, email: e.email || "your account" } }), e } 
                 catch (t) { console.warn("[MsgMate] Google sign-in failed:", t) } return null }
                  async function i() {
                     try {
                         let t = await chrome.storage.local.get("msgmate_auth_status");
                          if (t.msgmate_auth_status?.signedIn)return t.msgmate_auth_status; 
                            let e = await (await fetch(`${a}/api/auth/session`,
                                 { credentials: "include" })).json(); 
                                 if (e.signedIn) { let n = { signedIn: !0, email: e.email || "your account" }; return await chrome.storage.local.set({ msgmate_auth_status: n }), n } } catch { } return { signedIn: !1, email: null } } async function r() { return "session-cookie" } 
                                 function c() { o() } window.MsgMateClerk = { getClerkStatus: i, getClerkToken: r, signIn: c }; })();
