const api_key = "3b422527-3c3c-49ef-8ea2-c7ee50fd538a"

const nickname = "mikefps1"
let response = fetch(`https://open.faceit.com/data/v4/players?nickname=${nickname}`, {
    method: "GET",
    headers: {
        "Authorization": `Bearer ${api_key}`,
        "x-api-key": api_key
    }
})

response.then(data => {
    console.log(data)
}).catch(error => {
    console.log(error)
})


// console.log(response)