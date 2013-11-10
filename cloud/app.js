
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var parseExpressHttpsRedirect = require('parse-express-https-redirect');
var parseExpressCookieSession = require('parse-express-cookie-session');
var translations = require('cloud/translations.js');
var _ = require('underscore');
var app = express();

init();
function init()
{
	console.log("Initialize goldfish cloud code!");
	//Initialize connection to parse.com server
	//Parse.initialize("RmBGhmXT2GfbGEbiACcapRuDJCiRVpvfOsFMk8Kx", "T2ITA7CJLe1euzM6gQ7CDOOMYNdeJUYZaJTOJBsZ");
	// Parse.initialize("Hr4lIVLHVFdTMyeE1Pj0bjv65uvKqCcObsAjxS0u", "2MIWLTtbdgflXZiyUqRolhxdC4y1EvZhW6Y7tHcX");
	// Parse.initialize("SJ5J3wGKWtORfyOPpr2crarg4ZUZi1UgL1mwO37G", "HOs6HgJoI2J7m14FyY7JM3YzNegrbNQRMs2pxfHl");
	Parse.initialize("2MHnY6mENTre86neL5d1SaQc1orqKW6ecHSQuWlU", "zT6cWku0N8tBwDJ7BnuA9Tfx51hPwpgmfnTrGuJ8");
}

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(parseExpressHttpsRedirect());  // Require user to be on HTTPS.
app.use(express.bodyParser());
app.use(express.cookieParser('YOUR_SIGNING_SECRET'));
app.use(parseExpressCookieSession({ cookie: { maxAge: 3600000 } }));

// You could have a "Log In" link on your website pointing to this.
app.get('/login', function(req, res)
{
	res.render('login', translations.login);
});

// Clicking submit on the login form triggers this.
app.post('/login', function(req, res)
{
	if(!req.body)
	{
		var login = translations.login;
		login.msg = "Must insert values";
		return res.render('login', login);
	}
	if(!validate(req.body.username, "email"))
	{
		var login = translations.login;
		login.msg = "user name must be in email format";
		return res.render('login', login);
	}
	if(!validate(req.body.password, "string"))
	{
		var login = translations.login;
		login.msg = "Password must be a simple string (no fishy stuff please)";
		return res.render('login', login);
	}
	
	Parse.User.logIn(req.body.username, req.body.password,
	{
		success: function(user)
		{
			return res.render('adminConsole');
		},
		error:function(user, err)
		{
			var login = translations.login;
			login.msg = "Failed to login";
			return res.render('login', login);
		}
	});
	});

// You could have a "Log Out" link on your website pointing to this.
app.get('/logout', function(req, res) 
{
	Parse.User.logOut();
	res.redirect('/');
});

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/hello', function(req, res) {
  res.render('hello', { message: 'Congrats, you just set up your app!' });
});

app.get('/adminConsole', auth, function(req, res)
{
	res.render('adminConsole');
});

app.get('/form', auth, function(req, res)
{
	switch(req.query.id)
	{
	case 'createComp':
		res.render('createCompany', translations.createCompany);
		break;
	case 'createUser':
		var Company = Parse.Object.extend("Company");
		var query = new Parse.Query(Company);
		//query.select("name", "objectId");
		query.notEqualTo("name", "a");
		query.find({
			success: function(results)
			{
				var obj = _.clone(translations.createUser);
				obj.companies = [];
				for(var i=0; i<results.length; i++)
				{
					obj.companies.push({name: results[i].get("name"), objectId : results[i].id});
				}
				return res.render('createUser', obj);
			},
			error: function(err)
			{
				return errorReply(res, err.message, err.code);
			}
		});
		break;
	case 'createReality':
		res.render('createReality', translations.createReality);
		break;
	case 'findAndDelete':
		res.render('findAndDelete', translations.findAndDelete)
		break;
	default:
		return res.send('Wrong form id:' + req.query.id);
	}
});

app.post('/createCompany', auth, function(req, res)
{
	var Company = Parse.Object.extend("Company");
	var company = new Company();
	if(validate(req.body.element_1, "string"))
		company.set("name", req.body.element_1.trim());
	else
		return errorReply(res, "Invalid company name", 400);
	if(validate(req.body.element_2, "string"))
		company.set("address", req.body.element_2.trim());
	if(validate(req.body.element_3, "string"))
		company.set("pcId", req.body.element_3.trim());
	if(validate(req.body.element_4, "number"))
		company.set("targetMax", new Number(req.body.element_4).valueOf());
	if(validate(req.body.element_5, "number"))
		company.set("unitsJumps", new Number(req.body.element_5).valueOf());
	if(validate(req.body.element_6, "string"))
		company.set("unitsCodePoint", req.body.element_6.trim());
	if(validate(req.body.element_7, "string"))
		company.set("units", req.body.element_7.trim());
	if(validate(req.body.element_8, "string"))
		company.set("itemsDescription", req.body.element_8.trim());
	if(validate(req.body.element_9, "string"))
		company.set("itemsDescriptionFemale", req.body.element_9.trim());
	if(validate(req.body.element_10, "string"))
		company.set("items", req.body.element_10.split(","));
	if(validate(req.body.element_11, "boolean"))
	{
		if( (req.body.element_11 === '0') || (req.body.element_11 === 0) || 
			(req.body.element_11 === 'false') || (req.body.element_11 === false) )
			company.set("showItems", false);
		else 
			company.set("showItems", true);
	}
	if(validate(req.body.element_10, "string"))
		company.set("jobDescription", req.body.element_12.split(","));
	company.save(null, {
		success: function(comp)
		{
			console.log("Company saved successfuly");
			var items = comp.get("items");
			var obj = {
				elements : [
				    {key : translations.createCompany.title, value : "", type : "title"},
				    {key : translations.createCompany.lbl_compName, value : comp.get("name")},
				    {key : translations.createCompany.lbl_address, value : comp.get("address")},
				    {key : translations.createCompany.lbl_companyId, value : comp.get("pcId")},
				    {key : translations.createCompany.lbl_dailyMax, value : comp.get("targetMax")},
				    {key : translations.createCompany.lbl_dailyJumps, value : comp.get("unitsJumps")},
				    {key : translations.createCompany.lbl_unitCodePoint, value : comp.get("unitsCodePoint")},
				    {key : translations.createCompany.lbl_unitWord, value : comp.get("units")},
				    {key : translations.createCompany.lbl_itemsDefinitions, value : comp.get("itemsDescription")},
				    {key : translations.createCompany.lbl_itemsDefinitionsFemale, value : comp.get("itemsDescriptionFemale")},
				    {key : translations.createCompany.lbl_itemsList, value : items, tag : "list"},
				    {key : translations.createCompany.lbl_showItemsPage2, value : ( (items != null) && (items.length > 0) )},
				    {key : translations.createCompany.lbl_jobDescription, value : comp.get("jobDescription"), tag : "list"}
				]};
			return res.render("showRecords", obj);
			//return res.json(200, comp);
		},
		error: function(comp, error)
		{
			console.log("Could not save company. Err: " + JSON.stringify(error));
			return errorReply(res, error.message, error.code);
		}
	});
});

app.post('/createUser', function(req, res)
{
	var user = new Parse.User();
//	if(req.body.create)
//		return updateUser(req, res);
	if(validate(req.body.element_3, "string"))
		user.set("pcId", req.body.element_3.trim());
	
	if(validate(req.body.element_4, "string"))
	{
		var Company = Parse.Object.extend("Company");
		var company = new Company();
		company.id = req.body.element_4;
		user.set("company", company);
	}
	else
		return errorReply(res, "Invalid company value", 400);
	if(validate(req.body.element_4_1, "string"))
		user.set("branch", req.body.element_4_1.trim());
	if(validate(req.body.element_5, "string"))
		user.set("firstName", req.body.element_5.trim());
	else
		return errorReply(res, "Must provide valid first name", 400);
	if(validate(req.body.element_5_2, "string"))
		user.set("lastName", req.body.element_5_2.trim());
	if(validate(req.body.element_6, "email"))
		user.set("email", req.body.element_6.trim());
	else
		return errorReply(res, "must provide valid email", 400);
	user.set("username", req.body.element_6.trim());
	user.set("password", req.body.element_3.trim());//Password is id number for now
	user.set("birthDate", new Date(req.body.element_8));
	if(req.body.element_10 == "1")
		user.set("gender", "male");
	else
		user.set("gender", "female");
	switch(req.body.element_11)
	{
	case "2":
		user.set("type", 10);//Type are 10=manager, 20=worker
		break;
	default:
		user.set("type", 20);
	}
	if(validate(req.body.element_9, "number"))
		user.set("seniority", new Number(req.body.element_9).valueOf());
	user.signUp(null, {
		success: function(u)
		{
			u.get("company").fetch({
				success: function(company)
				{
					console.log("user create: " + JSON.stringify(u));
					var jobTitle = (u.get("type") == 10?translations.createUser.lbl_manager:translations.createUser.lbl_worker); 
					var obj = {
						elements : [
						    {key : translations.createUser.title, value : "", type : "title"},
						    {key : translations.createUser.lbl_firstName, value : u.get("firstName")},
						    {key : translations.createUser.lbl_lastName, value : u.get("lastName")},
						    {key : translations.createUser.lbl_email, value : u.get("email")},
						    {key : translations.createUser.lbl_username, value : u.get("username")},
						    {key : translations.createUser.lbl_pcId, value : u.get("pcId")},
						    {key : translations.createUser.lbl_birthDate, value : u.get("birthDate")},
						    {key : translations.createUser.lbl_gender, value : u.get("gender")},
						    {key : translations.createUser.lbl_company, value : company.get("name")},
						    {key : translations.createUser.lbl_branch, value : u.get("branch")},
						    {key : translations.createUser.lbl_jobTitle, value : jobTitle},
						    {key : translations.createUser.lbl_seniority, value : u.get("seniority")}
					]};
					console.log("User json=" + JSON.stringify(obj));
					return res.render("showRecords", obj);
				},
				error:function(company, err)
				{
					console.log("user create: " + JSON.stringify(u));
					var jobTitle = (u.get("type") == 10?translations.createUser.lbl_manager:translations.createUser.lbl_worker); 
					var obj = {
						elements : [
						    {key : translations.createUser.title, value : "", type : "title"},
						    {key : translations.createUser.lbl_firstName, value : u.get("firstName")},
						    {key : translations.createUser.lbl_lastName, value : u.get("lastName")},
						    {key : translations.createUser.lbl_email, value : u.get("email")},
						    {key : translations.createUser.lbl_username, value : u.get("username")},
						    {key : translations.createUser.lbl_pcId, value : u.get("pcId")},
						    {key : translations.createUser.lbl_birthDate, value : u.get("birthDate")},
						    {key : translations.createUser.lbl_gender, value : u.get("gender")},
						    {key : translations.createUser.lbl_company, value : u.get("company").id},
						    {key : translations.createUser.lbl_branch, value : u.get("branch")},
						    {key : translations.createUser.lbl_jobTitle, value : jobTitle},
						    {key : translations.createUser.lbl_seniority, value : u.get("seniority")}
					]};
					console.log("User json=" + JSON.stringify(obj));
					return res.render("showRecords", obj);
				}
			});
		},
		error: function(u, err)
		{
			console.log("Failed to create user: " + JSON.stringify(u));
			console.log("Failed to create user: " + JSON.stringify(err));
			return errorReply(res, err.message, err.code);
		}
	});
});

app.post('/createReality', function(req, res)
{
	console.log("Create reality");
	var query = new Parse.Query(Parse.User);
	query.equalTo("username", req.body.element_3.trim());
	query.first({
		success:function(user)
		{
			console.log("Found user");
			if(!user || (user.get("username") != req.body.element_3.trim()) )
				return errorReply(res, "Failed to find this user", 400);
			//Now insert the rest to monthly and user if needed 
			var Monthly = Parse.Object.extend("Monthly");
			var monthly = new Monthly();
			
			try
			{
				//Check that time is logically valid and add to monthly
				var offset = new Number(req.body.GMTOffset);
				var now = new Date();
				now = new Date(now.getTime() + (offset * (-60) *1000)); //Fix the time zone offset
				var date = new Date(req.body.element_17 + "T" + req.body.element_16);//UTC2Local(req.body.element_17, req.body.element_16);
				if(now.getTime() > date.getTime())
					throw new Error("You can't assign shift in the past!");
				monthly.set("user", user);
				monthly.set("month", date.getMonth());
				monthly.set("year", date.getFullYear());
				monthly.set("sales", createSales(req));
				monthly.set("actions", craeteActions(req));
				monthly.set("energies", craeteEnergies(req));
				monthly.save(null, {
					success: function(month)
					{
						if(month)
						{
							//TODO: Create a push function that schedule the next shift notification (same as onBeforeSave())
							console.log("Monthly created with id=" + month.id);
							var obj = {
								elements : [
								    {key : translations.createReality.title, value : "", type : "title"},
								    {key : translations.createReality.lbl_pcId, value : month.get("user").id},
								    {key : translations.createReality.lbl_monthlySales, value : month.get("sales").monthly},
								    {key : translations.createReality.lbl_numOfShifts, value : month.get("sales").num_of_shifts},
								    {key : translations.createReality.lbl_valuesList, value : month.get("energies").offers, tag:"list"},
								    {key : translations.createReality.lbl_myChalange, value : month.get("energies").blockers},
								    {key : translations.createReality.lbl_chalangeAwarness, value : month.get("energies").releasers},
								    {key : translations.createReality.lbl_actionPlanning, value : month.get("actions").offers},
								    {key : translations.createReality.lbl_year, value : month.get("year")},
								    {key : translations.createReality.lbl_month, value : month.get("month")+1}
								]
							};
							return res.render("showRecords", obj);
						}
						else
							return errorReply(res, "Could not store the new reality", 500);
					},
					error: function(month, err)
					{
						return errorReply(res, err.message, err.code);
					}
				});
			}
			catch(err)
			{
				return errorReply(res, err.message, 400);
			}
		},
		error: function(user, err)
		{
			return errorReply(res, "Failed to find the user for this reality", 400);
		}
	});
});

app.post('/deleteUser', function(req, res)
{
	var currentUser = Parse.User.current();
	if(!currentUser) 
		return res.json(200, "Please login in order to delete user");
	var userType = currentUser.get('type');
	console.log("User type=" + userType);
	//if(userType > 10)
		//return res.json(603, "You are not authorized to delete a user");
	console.log("username = " + req.body.username.trim());
	var query = new Parse.Query(Parse.User);
	query.equalTo("username", req.body.username.trim());
	//Parse.Cloud.useMasterKey();
	query.first({
		success:function(user)
		{
			if(!user)
				return res.json(404, "User was not found");
			//Parse.Cloud.useMasterKey();
			user.destroy({
				success: function (u)
				{
					res.json(200, "User deleted: " + JSON.stringify(u));
				},
				error : function(u, err)
				{
					if(!err)
						err = {message : "Even error failed!", code : 500};
					return errorReply(res, err.message, err.code);
				}
			});
		},
		error: function(user, err)
		{
			if(!err)
				err = {message : "Even error failed!", code : 500};
			return errorReply(res, err.message, err.code);
		}
	});
});

app.post('/deleteCompany', function(req, res)
{
	var Company = Parse.Object.extend("Company");
	var query = new Parse.Query(Company);
	query.equalTo("pcId", req.body.pcId.trim());
	query.find({
		success : function(companies)
		{
			var count = 0;
			var resComp = [];
			if(companies.length == 0)
				return res.json(404, "No comanies with that id found");
			for(var i=0; i<companies.length; i++)
			{
				companies[i].destroy({
					success:function(com)
					{
						resComp.push(com);
						count++;
						if(count >= companies.length)
							return res.json(200, "Companies deleted: " + JSON.stringify(resComp));
					},
					error: function(com, err)
					{
						return res.json(err.code, "Failed to delete company: " + JSON.stringify(com));
					}
				});
			}
		},
		error : function(comp, err)
		{
			return errorReply(res, err.message, err.code);
		}
	});
});

app.post('/deleteReality', function(req, res)
{
	var query = new Parse.Query(Parse.User);
	query.equalTo("username", req.body.username.trim());
	query.first({
		success:function(user)
		{
			console.log("found user:" + JSON.stringify(user));
			var year = parseInt(req.body.year);
			var month = parseInt(req.body.month)-1;
			//console.log("Checking for:" + year + "-" + (month - 1) );
			if(user)
			{
				var Monthly = Parse.Object.extend("Monthly");
				var q = new Parse.Query(Monthly);
				q.equalTo("user", user);
				q.equalTo("year", year);
				q.equalTo("month", month);
				q.find({
					success:function(months)
					{
						console.log("found months:" + JSON.stringify(months));
						var count = 0;
						var resMonths = [];
						if(months.length == 0)
							return res.json(404, "No monthlies objects with these parameters found");
						for(var i=0; i<months.length; i++)
						{
							months[i].destroy({
								success:function(mon)
								{
									resMonths.push(mon);
									count++;
									if(count >= months.length)
										return res.json(200, "Removed monthly objects:" + JSON.stringify(resMonths));
								},
								error: function(mon, err)
								{
									return res.json(err.code, "Error removing monthly:" + JSON.stringify(mon));
								}
							});
						}
						
						//return res.json(200, "Number of months deleted: " + months.length);
					},
					error : function(mon, err)
					{
						return errorReply(res, err.message, err.code);
					}
				});
			}
		},
		error: function(user, err)
		{
			return errorReply(res, err.message, err.code);
		}
	});
});
/**
 * Create a sales object out of a request given from createReality call.
 * @param req - request that must contain the given attributes to hold sales.
 * @returns a JSON object represent sales entity.
 */
function createSales(req)
{
	if(!req)
		throw new Error("Request is not defined!");
	var sales = {};
	if(validate(req.body.element_4, "number"))
		sales.monthly = req.body.element_4.trim();
	else throw new Error("Missing monthly sales");
	if(validate(req.body.element_5, "number"))
		sales.num_of_shifts = req.body.element_5.trim();
	else throw new Error("Missing number of shifts");
	
	return sales;
}

/**
 * Create an actions object out of a request given from createReality call.
 * @param req - request that must contain the given attributes to hold actions.
 * @returns a JSON object represent actions entity.
 */
function craeteActions(req)
{
	if(!req)
		throw new Error("Request is not defined!");
	var actions = {};
	if(validate(req.body.element_14, "string"))
		actions.offers = req.body.element_14.split(",");
	for(var i=0; i<actions.offers.length; i++)
	{
		actions.offers[i] = actions.offers[i].trim();
	}
	
	return actions;
}

/**
 * Create an energies object out of a request given from createReality call.
 * @param req - request that must contain the given attributes to hold energies.
 * @returns a JSON object represent energies entity.
 */
function craeteEnergies(req)
{
	if(!req)
		throw new Error("Request is not defined!");
	var energies = {};
	//Paers and setup offers 
	var offers = [];
	if(!validate(req.body.element_7, "string") || !validate(req.body.element_12, "string") || !validate(req.body.element_13, "string"))
		throw new Error("No fishy code please!");
	var offersValues = req.body.element_7.split(",");
	if(offersValues.length < 5)
		throw new Error("You must provide no less than 5 karma values!");
	var offersSynos = [];
	offersSynos.push(req.body.element_6.split(","));
	offersSynos.push(req.body.element_11.split(","));
	offersSynos.push(req.body.element_10.split(","));
	offersSynos.push(req.body.element_9.split(","));
	offersSynos.push(req.body.element_8.split(","));
	
	for(var i=0; i<5; i++)
	{
		if(offersSynos[i].length < 4)
			throw new Error("You must provide no less than 4 synonims to each value!");
		var offer = {};
		var synos = offersSynos[i];
		offer.value = offersValues[i].trim();
		for(var j=1; j<=4; j++)
		{
			offer["syno" + j] = synos[j-1].trim();
		}
		offers.push(offer);
	}
	energies.offers = offers;
	
	//Parse and setup blockers and releasers
	energies.blockers = req.body.element_12.split(",");
	for(var i=0; i<energies.blockers.length; i++)
	{
		energies.blockers[i] = energies.blockers[i].trim();
	}
	energies.releasers = req.body.element_13.split(",");
	for(var i=0; i<energies.releasers.length; i++)
	{
		energies.releasers[i] = energies.releasers[i].trim();
	}
	
	return energies;
}

/**
 * Update push actions here as well some other information (such as accumulated sales on monthly)
 */
Parse.Cloud.beforeSave("Shift", function(req, res)
{
	console.log("Before saving shift");
	//Call to update the corresponding monthly object
	updateMonthlyDataOnShiftSave(req, res);
});

/**
 * Update various information on the corresponding monthly object when a shift is saved
 * @param req - the request from the client that contain the shift and user information
 */
function updateMonthlyDataOnShiftSave(req, res)
{
	//take the sales and call to other function to store accumulated monthly sales
	var shift = req.object;
	var user = req.user;
	var startDate = shift.get("startDate");
	if(startDate)
	{
		console.log("Update monthly - we have start date = " + startDate);
		//query for the relevant monthly and update its information (such as update accumulated sales for this month
		var Monthly = Parse.Object.extend("Monthly");
		var query = new Parse.Query(Monthly);
		var month = startDate.getMonth();
		query.equalTo("month", month);
		query.equalTo("user", user);
		query.first(
		{
			success: function(monthly)
			{
				var dailyDone = new Number(shift.get("sales").daily_done);
				if(monthly)
				{
					console.log("Monthly found + Daily done=" + dailyDone);
					if(dailyDone > 0)
					{
						var sales = monthly.get("sales");
						if(!sales.accumulated)
							sales.accumulated = new Number(0);
						sales.accumulated += dailyDone;
						monthly.set("sales", sales);
						monthly.save({
							success:function(mon)
							{
								if(mon)
									console.log("Monthly saved successefully");
								else
									console.log("No error but monthly was not saved");
								res.success();
							},
							error:function(mon, err)
							{
								console.error("Failed to save monthly:" + JSON.stringify(err));
								res.error(err);
							}
						});
					}
					else
						return res.success();
				}
				else
				{
					console.log("Monthly not found");
					res.error();
				}
				
			},
			error: function(monthly, error)
			{
				console.error(error);
				res.error(error);
			}
		});
	}
}

//Parse.Cloud.afterSave("Shift", function(req, res)
//{
//	var installationId = req.user.get("installationId");
//	if(installationId)
//	{
//		var query = new Parse.Query(Parse.Installation);
//		query.equalTo("installationId", installationId);
//		Parse.Push.send({
//			where: query,
//			data : 
//			{	
//				alert : "Send from cloud"
//			}
//		},
//		{
//			success: function() 
//			{
//				console.log("Push from cloud was successful");
//				res.success();
//			},
//			error: function(error) 
//			{
//				console.error("Failed to push from cloud:" + error);
//				res.error(error);
//			}
//		});
//	}
//	else
//	{
//		console.error("Failed to push from cloud");
//		res.error("Failed to push from cloud");
//	}
//});


//Parse.Cloud.beforeSave(Parse.Installation, function(req, res)
//{
//	//Parse.Cloud.useMasterKey();
//	var user = Parse.User.current();
//	console.log("Before saving installation with user - " + JSON.stringify(user));
//	res.success();
//});
//
//Parse.Cloud.afterSave(Parse.Installation, function(req, res){
//	var inst = req.object;
//	if(inst)
//	{
//		var user = req.user;
//		user.set("installationId", inst.get("installationId"))
//		user.save(null, {
//			success:function(usr)
//			{
//				console.log("User paired with installation successfully");
//				res.success();
//			},
//			error: function(usr, err)
//			{
//				console.error("User failed to pair with installation");
//				res.error(err);
//			}
//		})
//	}
//	else
//	{
//		console.error("failed to find installation object after save");
//		res.error("failed to find installation object after save");
//	}
//});

// // Example reading from the request query string of an HTTP get request.
// app.get('/test', function(req, res) {
//   // GET http://example.parseapp.com/test?message=hello
//   res.send(req.query.message);
// });

// // Example reading from the request body of an HTTP post request.
// app.post('/test', function(req, res) {
//   // POST http://example.parseapp.com/test (with request body "message=hello")
//   res.send(req.body.message);
// });

// Attach the Express app to Cloud Code.
app.listen();

/**
 * Check if the request come from registered user and if not redirect to login page.
 */
function auth(req, res, next)
{
	var user = Parse.User.current();
	if(!user)
	{
		return res.redirect('/login');
	}
	
	next();
	//TODO:Do full fetch implementation and store in session
}

/**
 * Convert a UTC date and time to a local date and time
 * @param date - the date in UTC time zone. Note that date may include time in it
 * @param time - the time in UTC time zone.
 * @returns a full date object with the current local time.
 * @throws Exception on number format or custom "invalid date!" or custom "Invalid time!"  
 */
function UTC2Local(date, time)
{
	if(!date)
		throw new Error("Invalid date!");
	var d = new Date(date);
	if(time)
	{
		var t = time.split(":");
		if(_.isArray(t) && ( (t.length == 2) || (t.length == 3) ))
		{
			//24 time format
			d.setHours(new Number(t[0]));
			d.setMinutes(new Number(t[1]));
			if( (t.length == 3) && (t[3].toLowerCase() == "pm") )
				d.setHours(d.getHours() + 12);
		}
	}
	var offset = d.getTimezoneOffset();
	if(offset != 0)
	{
		var dL = d.getTime();
		dL = dL + (offset*(-60)*1000);//The minus is since offset return how to get to UTC and not other way
		d = new Date(dL);
	}
	
	if(isNaN(d.getTime()))
		throw new Error("Invalid date!");
	return d;
};

/**
 * Validate that the given value adhere to the rules of type. 
 * Especially that the value does not contain fishy code.
 * @param value - the value to validate.
 * @param type - the type of the value. String is the default.
 * @returns true if validation passed or false otherwise.
 */
function validate(value, type)
{
	/*
	var ruleRegex = /^(.+?)\[(.+)\]$/,
    numericRegex = /^[0-9]+$/,
    integerRegex = /^\-?[0-9]+$/,
    decimalRegex = /^\-?[0-9]*\.?[0-9]+$/,
    emailRegex = /^[a-zA-Z0-9.!#$%&amp;'*+\-\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/,
    alphaRegex = /^[a-z]+$/i,
    alphaNumericRegex = /^[a-z0-9]+$/i,
    alphaDashRegex = /^[a-z0-9_\-]+$/i,
    naturalRegex = /^[0-9]+$/i,
    naturalNoZeroRegex = /^[1-9][0-9]*$/i,
    ipRegex = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
    base64Regex = /[^a-zA-Z0-9\/\+=]/i,
    numericDashRegex = /^[\d\-\s]+$/,
    urlRegex = /^((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;*/
	var ret = false;
	switch(type)
	{
	case "string":
		//Adhere to string type
		if( (value != null) && (value.length <= 200) && !(/<script.*>/).test(value))
			ret = true;
		break;
	case "number":
		ret = (/^[0-9]+$/).test(value);
		break;
	case "date":
		var v = new Date(value);
		ret = _.isDate(v);
		break;
	case "time":
		if(_.isString(value))
		{
			var parts = value.split(":");
			if( (parts.length == 2) && _.isNumber(parts[0]) && _.isNumber(parts[1]) )
				ret = true;
			else if( (parts.length == 3) && _.isNumber(parts[0]) && _.isNumber(parts[1]) && 
					(parts[2].toLowerCase() == "am" || parts[2].toLowerCase() == "pm") )
				ret = true;
		}
		break;
	case "array":
		_.isArray(value);
		break;
	case "boolean":
		ret = _.isBoolean(value) || (_.isNumber(value) && (value === 1 || value === 0)) || 
			(_.isString(value) && (value === '0' || value ==='1' || 
			value.toLowerCase() === 'false' || value.toLowerCase() === 'true'));
		console.log("Is boolean = " + ret + " for " + value);
		break;
	case "email":
		ret = (/^[a-zA-Z0-9.!#$%&amp;'*+\-\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/).test(value);
		break;
	}
	
	return ret;
}

/**
 * Used to reply and error message
 * @param res
 * @param msg
 */
function errorReply(res, msg, status)
{
	if(res)
	{
		if(!status)
			status = 400;
		res.json(status, {error: msg});
	}
}
