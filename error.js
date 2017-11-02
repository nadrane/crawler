  const axios = require('axios')
  const robotsParser = require("robots-parser");
const robotsTxtUrl = 'http://getformsonline.com/robots'
axios.get(robotsTxtUrl)
  .then(res => {
    console.log(res.data)
    try {
      parser = robotsParser(robotsTxtUrl, res.data);
    } catch(err) {
      console.log(err)
    }
  })
  .catch(console.log)