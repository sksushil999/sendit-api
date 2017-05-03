# atoms

## installation

sudo chmod -R 777 logs
NODE_ENV=dev pm2 start app.js --name atoms-api-dev

### a typical job

```JSON
{
    "code": "attendanceEmail",
    "processor": "email", // email, sms, push
    "schedule": {
        "hour": 16,
        "minute": 45
    },
    "template": {
        "code": "attendanceEmail"
    },
    "client": {
        "code": "my-client"
    },
    "data": {
        "source": {
            "url": "http://datasource.com/api/v2/employees",
            "field": "items",
            "type": "array",
            "headers": {
                "orgCode": "gku",
                "x-access-token"="usertoken"
            }
        }
    },
    "config": {
        "to": {
            "field": "User.Email",
            "tackingId": "User.Id"
        },
        "from": "info@my-client.in",
          "notify": [
                "admin@my-client.in"
               ]
    },
  
}
```
