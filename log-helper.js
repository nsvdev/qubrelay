const chalk = require('chalk');

class Logger {
  //Self described Logger class, ffs...

	constructor(props) {
		this.prefix = props.prefix;
	}
	log(level, data) {
		if (typeof(data) == typeof({})) {
			let message = `[${chalk.green(new Date())}] ${chalk.magenta.underline.bold(this.prefix)} ${chalk.cyan.italic(level)}`
			console.log(message);
			console.log(data);
		}else{
			let message = `[${chalk.green(new Date())}] ${chalk.magenta.underline.bold(this.prefix)} ${chalk.cyan.italic(level)}: ${data}`
			console.log(message);
		}
	}
}

module.exports = Logger;
