/**
 * This is the web project resource management script.
 * It performs one of the following types of build:
 * 
 * 1. per lib customized build, since some of the libs comes in scattered src
 * 2. combined libs (with bower libs map prep: load-lib-map)
 * 
 */

var buildify = require('buildify'),
path = require('path'),
fs = require('fs'),
ncp = require('ncp').ncp,
colors = require('colors'),
_ = require('underscore');

ncp.limit = 16;

buildify.task({
	name: 'fix-libs',
	depends: ['uri-js', /*'noty', */'spin-js', 'jquery-file-upload', 'min'],
	task: function(){}
});

/**
 * =======================================
 * Per Bower/Custom Lib Specifics (combine, minify)
 * =======================================
 */

buildify.task({
	name: 'uri-js',
	task: function(){
		buildify()
			.setDir('bower_components/uri.js/src')
			.concat(['URI.js', 'IPv6.js', 'SecondLevelDomains.js', 'punycode.js', 'URITemplate.js', 'jquery.URI.js', 'URI.fragmentURI.js'])
			.save('../dist/uri.js')
			.uglify()
			.save('../dist/uri.min.js');
	}
});

buildify.task({
	name: 'noty',
	task: function(){
		var notyBase = 'bower_components/noty/';
		var list = fs.readdirSync(notyBase + 'js/noty/layouts');
		buildify()
			.setDir(notyBase + 'js/noty')
			.load('jquery.noty.js')
			.setDir(notyBase + 'js/noty/layouts')
			.concat(list)
			.setDir(notyBase)
			.save('dist/jquery.noty-with-layouts.js')
			.uglify()
			.save('dist/jquery.noty-with-layouts.min.js');

		ncp(notyBase + 'js/noty/themes', notyBase + 'dist/themes', function(err){
			if(err) console.log(err);
		})
	}
});

buildify.task({
	name: 'spin-js',
	task: function(){
		buildify()
			.setDir('bower_components/spin.js')
			.concat(['spin.js', 'jquery.spin.js'])
			.save('dist/spin-with-jqplugin.js')
			.uglify()
			.save('dist/spin-with-jqplugin.min.js');
	}
});

buildify.task({
	name: 'jquery-file-upload',
	task: function(){
		buildify()
			.setDir('bower_components/jquery-file-upload/js')
			.concat(['jquery.iframe-transport.js', 'jquery.fileupload.js'])
			.save('../dist/jquery-file-upload-with-iframe.js')
			.uglify()
			.save('../dist/jquery-file-upload-with-iframe.min.js');
	}
});


buildify.task({
	name: 'min',
	task: function(){
		var config = {
			'modernizr': 'modernizr.js'
		};

		_.each(config, function(js, pack){
			buildify().setDir(['bower_components', pack].join('/')).load(js).uglify().save([path.basename(js, '.js'), 'min', 'js'].join('.'));
		})
	}
});


/**
 * =======================================
 * Core/Base Libs (combine, minify)
 * Used as a base for new projects.
 * =======================================
 */
//----------------Workers--------------------
var libMap = {};
function combine(list, name){
	var target = buildify().load('EMPTY.js');
	_.each(list, function(lib){
		if(libMap[lib])
			console.log(lib.yellow, '[', libMap[lib].grey, ']');
		else {
			console.log(lib, 'not found!'.red);
			return;
		}
		target.concat(libMap[lib]);
	});
	target.setDir('dist').save(name + '.js').uglify().save(name + '.min.js');
};
//-------------------------------------------

buildify.task({
	name: 'load-lib-map',
	task: function(){
		var map = require('./map.json'), fix = require('./map-fix.json');
		var libs = _.union(_.keys(map), _.keys(fix));
		//1. fix lib name-file map
		_.each(libs, function(lib){
			if(!map[lib] || !fix[lib]){
				libMap[lib] = map[lib] || fix[lib];
				return;
			}

			//lib main js path need a fix
			if(_.isString(map[lib])){ //map path is a string.
				libMap[lib] = map[lib] + '/' + fix[lib]; //combine map path and fixed path.
				return;
			}

			if(_.isArray(map[lib])){ //map path is an array.
				_.each(map[lib], function(f){
					if(f.match(fix[lib]+'$')) libMap[lib] = f; //select one from group.
				});
				if(!libMap[lib]) libMap[lib] = fix[lib]; //non selected, use fixed path directly.
				return;
			}

		});

		//2. double check lib file path
		_.each(libMap, function(path, key){
			//skip the unfixed arrays.
			if(_.isArray(path)) return;

			if(!path.match('\.js$'))
				libMap[key] = path + '/' + (key.match('\.js$')?key:(key + '.js'));
		});

		console.log('Total Libs:', String(_.size(libMap)).green);
	}
});
//-------------------------------------------

buildify.task({
	name: 'base-libs',
	depends: ['load-lib-map'],
	task: function(){
		var list = [
			'modernizr',
			'jquery',
			'jquery.transit',
			'jquery.cookie',
			'jquery-ui',
			'jquery-serializeForm',
			'jquery-sieve', //client side quick text search
			'jquery-file-upload',
			//'flexslider',
			'underscore',
			'underscore.string',
			'backbone', //include json2/3
			'marionette',
			'handlebars',
			'swag',
			'bootstrap2', 
			'store.js', //need json2 in backbone
			'uri.js',
			'momentjs',
			'marked',			
			'colorbox',
			//'spin.js',
			'nprogress',
			'raphael'
		];
		combine(list, 'base-libs');
	}
});

buildify.task({
	name: 'base-libs-latest', //with jquery2 and bootstrap3 , ie9+
	depends: ['load-lib-map'],
	task: function(){
		var list = [
			'modernizr',
			'jquery2', //version 2+
			'jquery.transit',
			'jquery.cookie',
			'jquery-ui',
			'jquery-serializeForm',
			'jquery-sieve',
			'jquery-file-upload',
			//'flexslider',
			'underscore',
			'underscore.string',
			'backbone', 
			'marionette',
			'handlebars',
			'swag',
			'bootstrap3', //version 3+
			'store.js', 
			'uri.js',
			'momentjs',
			'marked',			
			'colorbox',
			//'spin.js',
			'nprogress',
			'raphael'
		];
		combine(list, 'base-libs-latest');
	}
});

buildify.task({
	name: 'all',
	depends: ['fix-libs', 'base-libs', 'base-libs-latest'],
	task: function(){
		
	}
});

/**
 * =======================================
 * Special Libs (combine, minify)
 * Used for some of the projects...Tailored
 * =======================================
 */

// buildify.task({
// 	name: 'extjs', //for extjs projects enchancement.
// 	depends: ['load-lib-map'],
// 	task: function(){
// 		var list = ['json3', 'store.js', 'uri.js', 'handlebars.js', 'template-builder', 'spin.js', 'mask', 'i18n'];
// 		combine(list, 'extjs-patch');
// 	}

// });