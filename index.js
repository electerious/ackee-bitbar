#!/usr/bin/env /usr/local/bin/node
'use strict'

const path = require('path')
const fetch = require('node-fetch')
const bitbar = require('bitbar')

require('dotenv').config({
	path: path.resolve(__dirname, '.env'),
})

const endpoint = process.env.ACKEE_ENDPOINT
const token = process.env.ACKEE_TOKEN
const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone

;(async () => {
	const response = await fetch(endpoint, {
		method: 'post',
		headers: {
			'Authorization': `Bearer ${ token }`,
			'Content-Type': 'application/json',
			'Time-Zone': timeZone,
		},
		body: JSON.stringify({
			query: `
				{
					facts {
						viewsToday
						activeVisitors
					}
					domains {
						title
						facts {
							viewsToday
							activeVisitors
						}
					}
				}
			`,
		}),
	})

	if (response.ok === false) {
		const text = await response.text()
		throw new Error(text)
	}

	const json = await response.json()

	if (json.errors != null) {
		const message = json.errors[0].message
		throw new Error(message)
	}

	const domains = json.data.domains.map((domain) => {
		return {
			text: domain.title,
			submenu: [
				{
					text: `${ domain.facts.viewsToday } views`,
				},
				{
					text: `${ domain.facts.activeVisitors } active visitors`,
				},
			],
		}
	})

	return bitbar([
		{
			text: `${ json.data.facts.viewsToday } views`,
			dropdown: false,
		},
		bitbar.separator,
		{
			text: `${ json.data.facts.activeVisitors } active visitors`,
		},
		bitbar.separator,
		...domains,
	])
})()