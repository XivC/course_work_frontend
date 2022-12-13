let base_url = "http://127.0.0.1:8001/api/";
let adv_id = '';
let universes = [];
let creatures = [];
let weapons = [];
function date_or_null(date) {
    if (date == null) return '';
    return new Date(date).toISOString().slice(0, 10)
}

function render_adventures_table(data, single, for_target_adv) {
    console.log(data)

    function nested() {
        let ret = "";
        if (single) {
            console.log('single');
            data = [data]
        }
        for (const adv of data) {
            ret += `<tr>` +
                (for_target_adv ? "" : `<td><a href="${new URL("http://" + document.location.host + "/course_work_frontend/adventure.html?adv_id=" + adv.id)}"><span>${adv.name}</span></a></td>`) +
                `<td>${date_or_null(adv.created_at)}</td>
                <td>${date_or_null(adv.started_at)}</td>
                <td>${date_or_null(adv.finished_at)}</td>
                <td>${((x) => {
                    if (x == null) return ''; else return x ? "Да" : "Нет"
                })(adv.is_successful)}</td>
                </tr>`
        }
        return ret;
    }

    document.getElementById('adv_list_table').innerHTML = "" +
        "<table>" +
        "<tr>" +
        (for_target_adv ? "" : "<th>Приключение</th>") +
        "<th>Создано</th>" +
        "<th>Начало</th>" +
        "<th>Конец</th>" +
        "<th>Успешное?</th>" +
        "</tr>" +
        `${nested()}` +
        "</table>";

}

function fill_gen_options(){
    let elem = document.getElementById('universe_sel')
    elem.innerHTML = ""
    for (const universe of universes){
        elem.innerHTML += `<option value="${universe.id}">${universe.name}</option>`
    }
}
function init() {
    $.get(
        base_url + "adventures/",
    ).done(
        (data) => render_adventures_table(data, false, false)
    );
    $.get(
        base_url + "universes/",
    ).done(
        (data) => {universes=data; fill_gen_options()}
    );
    $.get(
        base_url + "creatures/",
    ).done(
        (data) => {creatures=data}
    );
    $.get(
        base_url + "weapons/",
    ).done(
        (data) => {weapons=data;}
    );
}


function render_team_table(team) {
    function nested() {
        let ret = "";
        for (const mate of team.mates) {
            ret += `
            <tr>
                <td><img src="${mate.creature.icon}" style="width:100px;height:100px;" alt="no icon"></td>
                <td>${mate.creature.name}</td>
                <td>${mate.creature.power}</td>`

            if (mate.weapon) ret += `   
                <td><img src="${mate.weapon.icon}" style="width:100px;height:100px;" alt="no icon"></td>
                <td>${mate.weapon.name}</td>
                <td>${mate.weapon.power}</td>`
            else ret += "<td></td><td></td><td></td>"
            ret += "</tr>"

        }
        return ret;
    }

    document.getElementById('team_table').innerHTML = "" +
        "<table>" +
        "<tr>" +
        "<th>Персонаж</th>" +
        "<th>Имя персонажа</th>" +
        "<th>Сила персонажа</th>" +
        "<th>Оружие</th>" +
        "<th>Название оружия</th>" +
        "<th>Сила оружия</th>" +
        "</tr>" +
        `${nested()}` +
        "</table>";

}

function render_battle_members(members, opponents) {
    console.log(members)
    function nested() {
        let ret = "";
        for (const member of members) {
            if (member.is_opponent !== opponents) continue;
            ret += `
            <tr>
                <td><img src="${member.battler.creature.icon}" style="width:100px;height:100px;" alt="no icon"></td>
                <td>${member.battler.creature.name}</td>
                <td>${member.battler.creature.power}</td>`

            if (member.battler.weapon) ret += `   
                <td><img src="${member.battler.weapon.icon}" style="width:100px;height:100px;" alt="no icon"></td>
                <td>${member.battler.weapon.name}</td>
                <td>${member.battler.weapon.power}</td>`
            else ret += "<td></td><td></td><td></td>"
            ret += "</tr>"

        }
        return ret;
    }

    return "" +
        "<table>" +
        "<tr>" +
        "<th>Персонаж</th>" +
        "<th>Имя персонажа</th>" +
        "<th>Сила персонажа</th>" +
        "<th>Оружие</th>" +
        "<th>Название оружия</th>" +
        "<th>Сила оружия</th>" +
        "</tr>" +
        `${nested()}` +
        "</table>";

}

function render_battles(battles) {
    let elem = document.getElementById('battles')
    for (const battle of battles) {
        elem.innerHTML += `<h2>Битва на планете "${battle.planet.name}"</h2>`
        elem.innerHTML += `
            <table>
                <tr>
                    <th>Силы союзников</th>
                    <th>Силы противников</th>
                </tr>
                <tr>
                    <td>${battle.report.allies_power}</td>
                    <td>${battle.report.opponents_power}</td>
                </tr>
            </table> 
        `
        elem.innerHTML += `
            <h3>Союзники</h3>
            ${render_battle_members(battle.members, false)}
            <h3>Противники</h3>
            ${render_battle_members(battle.members, true)}
        `
    }
}

function render_adventure(adv) {
    document.getElementById('adv_name').innerText = `Приключение "${adv.name}"`;
    render_adventures_table(adv, true, true);
    document.getElementById('team_name').innerText = `Комнанда "${adv.team.name}"`;
    render_team_table(adv.team);
}

function adv_step(){
    $.post(base_url + `adventures/${adv_id}/step/`).done((data) => init_adventure())
}
function init_adventure() {
    let params = (new URL(document.location)).searchParams;
    adv_id = params.get("adv_id");
    $.get(base_url + `adventures/${adv_id}/`).done((data) => render_adventure(data))
    $.get(base_url + `adventures/${adv_id}/battles/`).done((data) => render_battles(data))

}

function gen_adventure(){
    let universe_id = parseInt(document.getElementById('universe_sel').value)

    let universe = universes.filter(u => u.id === universe_id)[0]

    let planets_ids = universe.planets.map(p => p.id)

    let planets_iterations = Math.floor(1 + Math.random() * (planets_ids.length*1.3-1))
    let planets_in_adv = []
    for (let i = 0; i < planets_iterations; i++){
        let index = Math.floor(Math.random() * (planets_ids.length));
        planets_in_adv.push(planets_ids[index]);
    }
    planets_in_adv = [...new Set(planets_in_adv)];
    let creatures_in_universe= creatures.filter(c => planets_ids.includes(c.planet)).map(c => c.id)
    let creatures_in_adv = creatures_in_universe.filter(c => Math.random() > 0.7)
    if (creatures_in_adv.length === 0) creatures_in_adv = [creatures_in_universe[Math.floor(Math.random()*creatures_in_universe.length)]]
    let weapons_in_adv = weapons.map(w => w.id)
    weapons_in_adv.push(null)
    console.log(weapons_in_adv)
    let creatures_with_weapons = []

    for (const cid of creatures_in_adv){
        creatures_with_weapons.push({
            "creature": cid,
            "weapon": weapons_in_adv[Math.floor(Math.random() * weapons_in_adv.length)]
        })
    }
    let data = {
        "adventure_name": document.getElementById('adv_name').value,
        "team_name": document.getElementById('team_name').value,
        "planets": planets_in_adv,
        "creatures_with_weapons": creatures_with_weapons
    }
    $.ajax(base_url + `adventures/start/`, {
        data : JSON.stringify(data),
        contentType : 'application/json',
        type : 'POST'
    }).done(d=>init())
    console.log(data)



}
