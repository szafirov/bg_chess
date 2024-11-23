async function extract(url, callback, args) {
	console.log(url)
	const response = await fetch(url)
	const el = document.createElement('html')
	el.innerHTML = await new Response(response.body).text()
	return await callback(el, args)
}

function eventScores(el) {
	const text = (n, selector) => n.querySelector(selector).textContent
	const scores = el.querySelectorAll('.tournaments-live-view-results-row:has(.tournaments-live-view-results-points)')
	return scores.map(s => {
		user = text(s, '.user-tagline-username')
		rank = parseInt(text(s, '.tournaments-live-view-results-rank').split('#')[1])
		score = parseInt(text(s, '.tournaments-live-view-total-score'))
		stats = s.querySelector('.tournaments-live-view-total-stats')
		won = parseInt(text(stats, '.won'))
		draw = parseInt(text(stats, '.draw'))
		lost = parseInt(text(stats, '.lost'))

		return { user, rank, score, won, draw, lost }
	})
}

function extractYear(team, year) {
	for (let p = 1; p <= 1; p++) {
		console.log('page', p)
		fetch(`https://www.chess.com/clubs/pastevents/${team}?page=${p}`)
			.then(async (res) => {
				const el = document.createElement('html')
				el.innerHTML = await new Response(res.body).text()
				console.log(el.innerHTML)
				const arenas = el.querySelectorAll('.events-list-item:has(.events-list-arena) a')
				const swiss = el.querySelectorAll('.events-list-item:has(.events-list-swiss) a')
				console.log('arenas', arenas)

				const urls = [...arenas, ...swiss].map(a => a.href)
				console.log(urls)
				//const scores = urls.map(async (url) => await extract(url, eventScores))
				//console.log(scores)

				const dates = el.querySelectorAll('.events-list-details .events-list-detail:last-child div')
				const lastPage = [...dates].map(div => new Date(div.textContent)).map(d => d.getFullYear()).some(y => y < year)
				if (lastPage) console.log('last page')
			})
	}
}

extractYear('team-bulgaria2', 2024)
