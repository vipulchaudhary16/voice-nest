# Flow changed

## Tables

### Tenant
- _id
- name
- city
- ivr_data json

### User
- _id
- name
- email
- password
- tenant id

### Contacts
- _id
- phone_no
- name
- tenant_id

### Campaign
- _id
- name
- date
- contacts
- tenant_id

### Calls
- from
- to
- time
- campaign_id (not sure how will i get this...)
- meta data from this url => https://3be8-2401-4900-7928-1d99-7129-c906-1d08-217a.ngrok-free.app/exotel/press/1?CallSid=cf3f423a8799a899bf4d7574f6461a43&CallFrom=09737565473&CallTo=08047113155&Direction=outbound-dial&Created=Fri%2C+03+Apr+2026+10%3A04%3A28&DialCallDuration=0&StartTime=2026-04-03+10%3A04%3A28&EndTime=1970-01-01+05%3A30%3A00&CallType=call-attempt&DialWhomNumber=&flow_id=1215501&tenant_id=424020&From=09737565473&To=09513886363&CurrentTime=2026-04-03+10%3A04%3A54&digits=%221%22
- tenant_id

## Featues


- Login
- Secure routes
- CRDU on campaign, contact
- List of campains and contacts and calls
- Call list should be through socket
- Each table detail screen can be open through table

### Create campaign
- form will have name field
- and user can select contacts 
  - here show table kind design so user can select bulk too from table and search and filter

### Capture lead
/exotel/press/1?CallSid=cf3f423a8799a899bf4d7574f6461a43&CallFrom=09737565473&CallTo=08047113155&Direction=outbound-dial&Created=Fri%2C+03+Apr+2026+10%3A04%3A28&DialCallDuration=0&StartTime=2026-04-03+10%3A04%3A28&EndTime=1970-01-01+05%3A30%3A00&CallType=call-attempt&DialWhomNumber=&flow_id=1215501&tenant_id=424020&From=09737565473&To=09513886363&CurrentTime=2026-04-03+10%3A04%3A54&digits=%221%22
Get request on this end point will be hit.

Backend
- Nodejs, Expressjs, mongoose

Frontend
- Reactjs, tailwindcss, , socket.io-client