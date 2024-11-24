async function fetchJson(url) {
    const res = await fetch(url)
    return await new Response(res.body).json()
}

async function fetchCsv(url) {
    const res = await fetch(url)
    const csv = await new Response(res.body).text()
    return csv.split('\n').map(line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/))
}

async function fetchEvents(clubId, page) {
    let events = []
    const eventUrl = (type, url) => `https://www.chess.com/tournament/live/${type === 'arena' ? 'arena/' : ''}${url}`
    const { arena, live_tournament: swiss } = await fetchJson(`https://www.chess.com/callback/clubs/live/past/${clubId}?page=${page}`)
    events = events.concat(arena.filter(e => !e.is_multi_club_type).map(e => ({ ...e, event_type: 'arena' })))
    events = events.concat(swiss.filter(e => !e.is_multi_club_type).map(e => ({ ...e, event_type: 'swiss' })))
    events = events.map(e => ({ ...e, url: eventUrl(e.event_type, e.url), year: parseInt(e.start_date_iso.split('-')[0]) }))
    return events
}

async function fetchResults(e) {
    const csv = await fetchCsv(e.url + '/download-results')
    console.log(e.url, csv)
    const scoreIndex = e.event_type === 'arena' ? 7 : csv[0].findIndex(s => s === 'Score')
    return csv.filter(a => a && parseInt(a[0])).map(a => {
        return ({...e, rank: parseInt(a[0]), rating: a[6], user: a[4], score: parseInt(a[scoreIndex]) })
    })
}

async function fetchPage(clubId, page) {
    const events = await fetchEvents(clubId, page)
    eventPages.push(events)
    console.log(page, events)
    const list = await Promise.all(events.map(async (e) => await fetchResults(e)))
    const results = list.flat()
    results.forEach(r => {
        const { base_time_seconds, increment, event_type, game_time_class, game_type, rank, rating, score, url, user, year } = r
        resultsByUser[user] ??= []
        resultsByUser[user].push({ base_time_seconds, increment, event_type, game_time_class, game_type, rank, rating, score, url, user, year })
    })
}

function toCsv(array, excludeKeys = []) {
    const keys = Object.keys(array[0]).filter(key => !excludeKeys.includes(key))
    const csv = array.map((e) => keys.map(key => e[key]).join(','))
    csv.unshift(keys.join(','))
    return csv.join('\n')
}

async function throttledFetch(clubId, pages) {
    const asyncTimeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    eventPages = []
    resultsByUser = {}
    for (let p = 1; p <= pages; p++) {
        await fetchPage(clubId, p)
        await asyncTimeout(1000)
    }

    const events = eventPages.flat()
    console.log('events:', events)
    console.log('events.csv', toCsv(events, ['club', 'club_image_url', 'winner']))

    console.log('results:', resultsByUser)
    const results = Object.values(resultsByUser)
        .flat()
        .map(({ base_time_seconds, increment, event_type, game_time_class, game_type, rank, rating, score, url, user, year }) =>
            [base_time_seconds, increment, event_type, game_time_class, game_type, rank, rating, score, '"' + url + '"', user, year ].join(','))
    results.unshift('base_time_seconds, increment, event_type, game_time_class, game_type, rank, rating, score, url, user, year')
    console.log('results.csv', results.join('\n'))
}

let eventPages, resultsByUser
// 15 pages should be enough for now, currently we stop getting results on page 11
await throttledFetch(8677, 15)