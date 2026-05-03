const data = {
    service_id: 'service_fp8wrkh',
    template_id: 'template_s1qudba',
    user_id: 'PKqcekN0SliKgKXrd',
    template_params: {
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test message',
        subject: 'رسالة تجريبية'
    }
};

fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://arab-store.allqaqasyana.com'
    },
    body: JSON.stringify(data)
})
.then(response => {
    if (!response.ok) {
        return response.text().then(text => { throw new Error(text) });
    }
    return response.text();
})
.then(text => console.log('Success:', text))
.catch(error => console.error('Error:', error.message));
