var request_api = require('request')

exports.sendNotif = (title, body, tokens)=>{
    request_api({
        method : 'POST',
        url : 'https://fcm.googleapis.com/fcm/send',
        headers : {
            'Content-type' : 'application/json',
            'Authorization' : 'key=AAAAoZK9UUU:APA91bFIVXNXYtQwOyMwsF81IkRz1saWOQC8vk9Qyd_022lnVHTUkgLJIY7V0IpUJdo1FbYRetMcPJ6BxbAppsdGLr_1a-nMkAl-uiiaikZuyjysJRt5cQcH_sTK8fLAF6kGQj8yI1T9'
        },
       body : JSON.stringify({
        "notification": {
            "title" : title,
            "body" : body
        },
        "registration_ids" : tokens
       })
    }, function(result){ 
        console.log('Result push notif ', result)
       
    })
}