// Create Token and saving in cookie

const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken()

  console.log(token)

  // options for cookie
  const options = { expires: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000), httpOnly: true }; // secure: false,
  console.log("sending token")

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    user,
    token,
  })
}

export default sendToken



// const sendToken = (user, statusCode, res) => {
//   const token = user.getJWTToken();

//   res.status(statusCode).json({ succes: true, token, user, });
// };
// export default sendToken;
