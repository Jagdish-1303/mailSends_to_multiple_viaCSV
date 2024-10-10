const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { format } = require('date-fns');

let smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-mail-of_new',
        pass: 'your-mail-appPassword'           //  email password
    }
});

const logFilePath = path.join(__dirname, 'mailsender.log.txt');
const maillist = [];
const companyNames = [];
const names = [];
const emailRecords = [];

fs.createReadStream('recipients.csv')
    .pipe(csv())
    .on('data', (row) => {
        console.log(row)
        maillist.push(row.email);
        companyNames.push(row.company_name);
        names.push(row.name);
        emailRecords.push({ ...row, date_sent: '' });
    })
    .on('end', () => {
        // Send an email to each recipient in maillist
        maillist.forEach(function (to, index) {
            console.log(to);
            const recipientName = names[index];
            const companyName = companyNames[index];

            if (recipientName !== '' && companyName !== '') {
                let msg = {
                    from: 'jagdish',
                    to: to,
                    subject: 'Hello ✔',            // Subject line
                    text: `Hello ${recipientName},\n\nThis is an auto-generated email from ${companyName}, please ignore it ✔`,
                    // html: `<b>Hello ${recipientName},</b><br><p>This is an auto-generated email from ${companyName}.</p>` // HTML body (optional)
                };

                smtpTransport.sendMail(msg, function (err, info) {
                    if (err) {
                        console.log('Error occurred:', err);
                    } else {
                        console.log(`Email sent to: ${to}`, info.response);

                        const currentDate = format(new Date(), 'dd-MM-yyyy');
                        console.log("date", currentDate)
                        emailRecords[index].date_sent = currentDate;
                        writeToCSV(emailRecords);
                    }
                });
            } else {
                fs.appendFile(logFilePath, `No recipient name or Company name for email: ${to}\n`, (err) => {
                    if (err) {
                        console.error('Failed to write to log file:', err);
                    } else {
                        console.log(`Logged undefined recipient or companyName for email: ${to}`);
                    }
                });
            }
        });
    })
    .on('error', (err) => {
        console.error('Error reading CSV file:', err);
    });

function writeToCSV(records) {
    console.log("rec", records)
    const csvWriter = require('csv-writer').createObjectCsvWriter({
        path: 'recipients.csv',
        header: [
            { id: 'email', title: 'email' },
            { id: 'company_name', title: 'company_name' },
            { id: 'name', title: 'name' },
            { id: 'date_sent', title: 'date_sent' }
        ]
    });

    csvWriter.writeRecords(records)
        .then(() => {
            console.log('Updated CSV file with sent dates');
        })
        .catch((err) => {
            console.error('Error writing to CSV:', err);
        });
}