
(function(){
    async function enableStudentNotifications(){
        const btn=document.getElementById("studentEnableNotificationBtn");
        const text=document.getElementById("studentNotificationText");
        if(btn){
            btn.disabled=true;
            btn.innerText="⏳ Enabling...";
        }

        try{
            if(!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)){
                throw new Error("આ browser notifications support કરતું નથી.");
            }
            if(!window.isSecureContext){
                throw new Error("App Notifications માટે HTTPS જરૂરી છે.");
            }

            let permission=Notification.permission;
            if(permission==="denied"){
                throw new Error("Notifications Block છે. Browser settingsમાં આ site માટે Notifications → Allow કરો.");
            }
            if(permission!=="granted"){
                permission=await Notification.requestPermission();
            }
            if(permission!=="granted"){
                throw new Error("Notifications માટે Allow પસંદ કરવું જરૂરી છે.");
            }

            const token=localStorage.getItem("token");
            if(!token) throw new Error("Login session મળી નથી. ફરી login કરો.");

            const registration=await navigator.serviceWorker.register("/sw.js",{scope:"/"});
            await navigator.serviceWorker.ready;

            const keyRes=await fetch("/api/notifications/vapid-public-key",{
                headers:{Authorization:"Bearer "+token}
            });
            const keyData=await keyRes.json();
            if(!keyRes.ok || !keyData.publicKey){
                throw new Error(keyData.message || "VAPID public key મળ્યો નથી.");
            }

            let sub=await registration.pushManager.getSubscription();
            if(!sub){
                sub=await registration.pushManager.subscribe({
                    userVisibleOnly:true,
                    applicationServerKey:urlBase64ToUint8Array(keyData.publicKey)
                });
            }

            const saveRes=await fetch("/api/notifications/subscribe",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    Authorization:"Bearer "+token
                },
                body:JSON.stringify(sub.toJSON())
            });
            const saveData=await saveRes.json();
            if(!saveRes.ok || !saveData.success){
                throw new Error(saveData.message || "Notification subscription save થઈ નથી.");
            }

            if(text) text.innerHTML="<b style='color:#16a34a'>✅ App Notifications Enabled</b><br>હવે Update notifications તમને મળશે.";
            if(btn){
                btn.disabled=false;
                btn.innerText="✅ App Notifications Enabled";
                btn.style.background="linear-gradient(135deg,#16a34a,#059669)";
            }
        }catch(err){
            console.error("Student notification error:",err);
            if(text) text.innerHTML='<span style="color:#dc2626">❌ '+(err.message||"Notification enable થઈ નથી.")+'</span>';
            if(btn){
                btn.disabled=false;
                btn.innerText="🔔 Enable App Notifications";
            }
        }
    }

    async function checkStudentNotificationStatus(){
        const btn=document.getElementById("studentEnableNotificationBtn");
        const text=document.getElementById("studentNotificationText");
        if(!btn) return;

        try{
            if("Notification" in window && Notification.permission==="granted" && "serviceWorker" in navigator){
                const reg=await navigator.serviceWorker.getRegistration("/");
                const sub=reg ? await reg.pushManager.getSubscription() : null;
                if(sub){
                    btn.innerText="✅ App Notifications Enabled";
                    btn.style.background="linear-gradient(135deg,#16a34a,#059669)";
                    text.innerHTML="<b style='color:#16a34a'>Notifications ચાલુ છે.</b><br>Adminના notifications તમને મળશે.";
                }
            }
        }catch(e){
            console.log("Notification status:",e);
        }
    }

    window.enableStudentNotifications=enableStudentNotifications;
    window.addEventListener("load",function(){
        setTimeout(checkStudentNotificationStatus,300);
    });
})();
