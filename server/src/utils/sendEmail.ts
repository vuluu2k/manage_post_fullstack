import nodemailer from 'nodemailer';

// async..await is not allowed in global scope, must use a wrapper
export const sendEmail = async (to: string, html: string) => {
  try {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    console.log('Test account', testAccount,to,html);

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Go School 👻" <laptrinhvn2s@gmail.com>', // sender address
      to, // list of receivers
      subject: 'Khôi phục / Thay đổi mật khẩu', // Subject line
      text: 'Bạn vừa gửi mật yêu cầu khôi phục mật khẩu?', // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  } catch (error) {
    console.log(error);
  }
};
