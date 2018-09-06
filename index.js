/**
	*
	*	TCGPlayer:
	*
	* get new access_token aka: bearer token
	* expires every 2 weeks
	*
	*	curl --include --request POST \
	*	--header "application/x-www-form-urlencoded" \
	*	--data-binary "grant_type=client_credentials&client_id=PUBLIC_KEY&client_secret=PRIVATE_KEY" \
	*	'https://api.tcgplayer.com/token'
	*
	*	{
	* 	"access_token":"<some-token-here>",
	* 	"token_type":"bearer",
	* 	"expires_in":1209599,
	* 	"userName":"<public-key-here>",
	* 	".issued":"Thu, 06 Sep 2018 14:03:41 GMT",
	* 	".expires":"Thu, 20 Sep 2018 14:03:41 GMT"
	* }
	*
	**/


const fetch = require('node-fetch'); // mimics native browser fetch api
require('dotenv').load(); // load .env file



// 1.) check if access token is close to being expired
// 		 if it is within two days of expiring, renew it and save it

// 2.) get product ids by searching catagory name and product name
//		 admin selects the correct product and condition
// 		'http://api.tcgplayer.com/catalog/products'

// 3.) use ids returned from step 2. to get product pricing by productId
// 		 admin selects correct card

// 4.) use selected product of certain condition productConditionId to get pricing
//		'http://api.tcgplayer.com/pricing/marketprices/productconditionId'
// 		 conditions:
// 			 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'


// 'http://www.abx.com?x=2&y=3'
const addQueryParams = (url, query) => {
	const keys = Object.keys(query);
	const queryString = keys.reduce((str, key) => {
		const val = query[key];
		return str === '?' ? `?${key}=${val}` : `${str}&${key}=${val}`;
	}, '?');
	return `${url}${queryString}`;
};

const options = { 
  headers: {
  	'Content-Type':  'application/json',
  	'Authorization': `bearer ${process.env.ACCESS_TOKEN}`
  }
};


console.log('fetching...');


const getCatagoryProducts = (categoryName, productName) => {
	const fetchProducts = (offset, products) => {
		const query = {categoryName, limit: 10, offset, productName};
		const url 	= addQueryParams('http://api.tcgplayer.com/catalog/products', query);
		return fetch(url, options).
			then(res => res.json()).
			then(({results, totalItems}) => {
				if (!results.length) { return products; }
				const sumProducts = [...products, ...results];
				if (totalItems < query.limit) { return sumProducts; }// finished recursing
				return fetchProducts(offset + 10, sumProducts);
			}).
			catch(err => console.log(err));
	};
	return fetchProducts(0, []);
};
// product exact name
// getCatagoryProducts('Magic', 'Fireball').
// 	then(products => console.log('got products: ', products));



const getProductsPricing = productIds => {
	const ids = productIds.reduce((str, id) => str ? `${str}, ${id}` : `${id}`);
	const url = `http://api.tcgplayer.com/pricing/product/${ids}`;
	return fetch(url, options).
		then(res => res.json()).
		then(({results}) => results).
		catch(err => console.log(err));
};
// array of productIds
// getProductsPricing([109621]). 
// 	then(pricing => console.log('got product pricing: ', pricing));


const getProductConditionPricing = productConditionId => {	
	const url = `http://api.tcgplayer.com/pricing/marketprices/${productConditionId}`;
	return fetch(url, options).
		then(res => res.json()).
		then(json => {
			console.log('returned pricing: ', json);
			return json;
		}).
		then(({results}) => results).
		catch(err => console.log(err));
};
// productConditionId
// getProductConditionPricing(316933). 
// 	then(pricing => console.log('got condition pricing: ', pricing));



