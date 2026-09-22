import csv as csv_module
import io
import json
from playwright.sync_api import sync_playwright
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]

with TemporaryDirectory(prefix="datacenter-browser-") as output, sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    page=b.new_page(viewport={'width':1440,'height':1000})
    page.route('https://**/*',lambda r:r.abort())
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT / 'index.html').as_uri())
    assert page.locator('.state').count()==50
    assert page.locator('#state-dialog').evaluate('(e)=>!e.open')
    assert page.locator('#presets [aria-pressed=true]').inner_text()=='Balanced'
    page.screenshot(path=str(Path(output) / 'desktop.png'),full_page=True)
    candidate=page.locator('.candidate').first
    candidate.click()
    assert page.locator('#state-dialog').evaluate('(e)=>e.open')
    page.locator('#tab-scores').click()
    assert page.locator('#panel-scores').is_visible()
    assert page.locator('#detail .bar').count()==8
    page.keyboard.press('ArrowRight')
    assert page.locator('#panel-reception').is_visible()
    # Four axes, and the panel says plainly that none of it is scored.
    assert page.locator('#panel-reception .axes li').count()==4
    assert 'contribute no points' in page.locator('#panel-reception').inner_text()
    page.keyboard.press('ArrowRight')
    assert page.locator('#panel-sources').is_visible()
    assert page.locator('#panel-sources .source-list a').count()>0
    page.keyboard.press('Escape')
    assert candidate.evaluate('(e)=>document.activeElement===e')
    page.locator('#state-picker').select_option('AZ')
    assert page.locator('#profile-title').inner_text()=='Arizona · State profile'
    page.locator('#profile-state').select_option('VA')
    assert page.locator('#profile-title').inner_text()=='Virginia · State profile'
    page.locator('#tab-overview').click()
    page.screenshot(path=str(Path(output) / 'profile.png'))
    for width in [320,390,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':900})
        for state in ['VA','NC','ND','NH','RI','AK']:
            page.locator('#profile-state').select_option(state)
            for tab in ['overview','scores','reception','sources']:
                page.locator('#tab-'+tab).click()
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,state,tab)
                assert page.locator('#state-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),(width,state,tab,'dialog overflow')
                # The tab strip absorbs its own overflow rather than widening
                # the dialog, so every tab stays reachable on a narrow screen.
                assert page.locator('#tab-'+tab).evaluate('(e)=>e.getBoundingClientRect().width>0'),(width,tab)
        print('Responsive profiles passed',width)
    page.keyboard.press('Escape')
    page.locator('#w-pw').fill('40')
    page.locator('#w-pw').dispatch_event('input')
    weights=page.evaluate('({...weights})')
    page.locator('[data-l=physical]').click()
    page.locator('[data-l=all]').click()
    assert page.evaluate('({...weights})')==weights
    page.locator('#rank-mode').select_option('delivery')
    assert page.evaluate('STATES.filter(s=>s.rank===1).every(s=>deliveryTier(s)===0)')
    page.locator('.scale-options summary').click()
    page.locator('#price-high').fill('1')
    page.locator('#price-high').press('Tab')
    assert page.locator('#price-error').inner_text()
    assert page.evaluate('priceScale.high')==35
    page.locator('#price-high').fill('25')
    page.locator('#price-high').press('Tab')
    assert page.evaluate('priceScale.high')==25
    for inp in page.locator('#weights input').all():
        inp.fill('0');inp.dispatch_event('input')
    assert page.evaluate('STATES.every(s=>s.total===null && s.rank===null)')
    assert page.locator('#scsvg .dot circle').first.get_attribute('fill')=='#E6EAEE'
    page.locator('#state-picker').select_option('ND')
    assert 'Facts and sources remain available' in page.locator('#detail').inner_text()
    page.keyboard.press('Escape')
    page.locator('#reset-model').click()
    assert page.evaluate('priceScale.high===35 && rankMode==="fit" && weights.pw===10')
    page.locator('th[data-k=n] button').click()
    assert page.locator('#tbody tr').first.get_attribute('data-a')=='AL'
    # Sorting on a context column orders states without disturbing fit or rank.
    ranks=page.evaluate('Object.fromEntries(STATES.map(s=>[s.a,s.rank]))')
    pb_col=page.evaluate('[...document.querySelectorAll("#thead th")].findIndex(t=>t.dataset.k==="pb")+1')
    page.locator('th[data-k=pb] button').click()
    assert page.locator(f'#tbody tr:first-child td:nth-child({pb_col})').inner_text()=='High'
    page.locator('th[data-k=rules] button').click()
    assert page.evaluate('Object.fromEntries(STATES.map(s=>[s.a,s.rank]))')==ranks
    # The dataset is CC BY and in the repository, so the download asks nothing
    # of the visitor. Any form here would be a regression.
    assert page.locator('#dataset form, #dataset input, #dataset textarea').count()==0
    assert page.locator('#dp-links').is_visible()
    # Counting runs through GoatCounter, which is blocked in this run. A failed
    # or absent counter must not stop the file being handed over.
    assert page.evaluate('window.goatcounter===undefined')
    with page.expect_download() as caught:
        page.locator('#dp-links button[data-format=csv]').click()
    csv=Path(caught.value.path()).read_text()
    header,*body=[line for line in csv.splitlines() if line]
    assert len(body)==50,len(body)
    assert header.startswith('postal,state,')
    for column in ['pushback','rule_water','rule_power_cost','rule_siting_zoning','rule_tax_incentives']:
        assert column in header.split(','),column
    assert body[0].startswith('AK,Alaska,')
    with page.expect_download() as caught:
        page.locator('#dp-links button[data-format=json]').click()
    exported=json.loads(Path(caught.value.path()).read_text())
    assert len(exported)==50
    # The export is the authored record, not the fields compute() derives.
    assert set(exported[0])<= {'a','n','p','pw','po','op','w','h','c','x','mo','st','tag','note','rr','srcs'}
    assert set(exported[0]['rr'])=={'pb','wt','pg','zn','tx','n'}
    # With a counter present the download records that it happened, and nothing
    # identifying about who asked for it.
    page.evaluate('window.goatcounter={counted:[],count(o){this.counted.push(o)}}')
    with page.expect_download():
        page.locator('#dp-links button[data-format=csv]').click()
    counted=page.evaluate('window.goatcounter.counted')
    assert counted==[{'path':'dataset-download-csv','title':'Dataset download (CSV)','event':True}],counted

    # Shortlisting filters the comparison without redefining national ranks.
    assert page.locator('#rotate-btn').get_attribute('aria-pressed')=='false'
    page.locator('#shortlist-only').check()
    assert 'Your shortlist is empty' in page.locator('#tbody').inner_text()
    assert page.locator('#export-comparison').is_disabled()
    for state in ['VA','AZ']:
        page.locator('#shortlist-picker').select_option(state)
    assert page.locator('#tbody tr[data-a]').count()==2
    assert page.evaluate('Object.fromEntries(STATES.map(s=>[s.a,s.rank]))')==ranks
    with page.expect_download() as caught:
        page.locator('#export-comparison').click()
    comparison=list(csv_module.DictReader(io.StringIO(Path(caught.value.path()).read_text())))
    assert {s['postal'] for s in comparison}=={'VA','AZ'}
    assert all(abs(sum(float(v) for k,v in s.items() if k.startswith('weight_share_'))-1)<1e-9 for s in comparison)
    assert all(s['model_version']=='2' and s['price_anchor_high']=='35' for s in comparison)
    page.locator('#state-picker').select_option('VA')
    assert page.locator('#save-state').get_attribute('aria-pressed')=='true'
    page.locator('#save-state').click()
    assert page.locator('#save-state').get_attribute('aria-pressed')=='false'
    page.keyboard.press('Escape')
    assert page.locator('#tbody tr[data-a]').count()==1
    page.locator('[data-remove=AZ]').click()
    assert page.locator('#export-comparison').is_disabled()
    page.locator('#shortlist-only').uncheck()
    assert page.locator('#tbody tr[data-a]').count()==50

    # Project size loads a weight profile and moves the delivery floors; the
    # presets then adjust from there without touching the size.
    page.locator('[data-z=gw]').click()
    assert page.evaluate('size')=='gw' and page.evaluate('weights.pw')==35
    assert page.locator('#presets [aria-pressed=true]').count()==0
    assert page.evaluate('STATES.some(s=>s.pw===3 && s.op>=3 && deliveryTier(s)===1)')
    assert 'gigawatt campus' in page.locator('#size-note').inner_text().lower()
    page.locator('[data-p=balanced]').click()
    assert page.evaluate('size')=='gw' and page.evaluate('weights.pw')==10
    page.locator('[data-z=colo]').click()
    assert page.locator('#presets [aria-pressed=true]').inner_text()=='Connectivity first'
    page.locator('#w-x').fill('35');page.locator('#w-x').dispatch_event('input')
    assert page.locator('#presets [aria-pressed=true]').count()==0
    page.locator('#w-x').fill('30');page.locator('#w-x').dispatch_event('input')
    assert page.locator('#presets [aria-pressed=true]').inner_text()=='Connectivity first'
    page.locator('#reset-model').click()
    assert page.evaluate('size==="hyper" && weights.pw===10')
    assert page.locator('#sizes [aria-pressed=true]').inner_text().startswith('Hyperscale')

    # The tiers card lists the extremes of the current ranking, with ties
    # keeping their shared rank number.
    assert page.locator('#tiers li').count()==10
    assert page.locator('#tiers li').first.get_attribute('value')=='1'
    assert page.locator('#tiers li .tier-item').first.get_attribute('data-a')==page.evaluate('rankedStates()[0].a')
    page.locator('#rank-mode').select_option('delivery')
    assert page.evaluate('deliveryTier(BY[document.querySelector("#tiers .tier-item").dataset.a])')==0
    page.locator('#rank-mode').select_option('fit')

    # The share image is a real PNG, counted like a dataset download, and
    # unavailable when nothing is weighted.
    with page.expect_download() as caught:
        page.locator('#share-card').click()
    assert caught.value.suggested_filename.endswith('.png')
    assert Path(caught.value.path()).read_bytes()[:8]==b'\x89PNG\r\n\x1a\n'
    assert page.evaluate('window.goatcounter.counted.at(-1)')=={'path':'share-card-png','title':'Share card (PNG)','event':True}
    for inp in page.locator('#weights input').all():
        inp.fill('0');inp.dispatch_event('input')
    assert page.locator('#share-card').is_disabled()
    assert page.locator('#tiers li').count()==0
    page.locator('#reset-model').click()

    # The address reproduces a scenario, drops what is at its default, and
    # survives garbage without a script error.
    uri=(ROOT / 'index.html').as_uri()
    page.goto(uri+'?z=gw&w=35.25.10.20.5.5.0.0&v=physical&r=delivery&c=6-30&f=ranks&s=VA,AZ')
    assert page.evaluate('size')=='gw' and page.evaluate('weights.pw')==35 and page.evaluate('view')=='physical'
    assert page.locator('#rank-mode').input_value()=='delivery'
    assert page.evaluate('priceScale.high')==30 and page.locator('#price-high').input_value()=='30'
    assert page.evaluate('FIGS.active()')=='ranks'
    assert page.locator('#shortlist-chips button').count()==2
    assert page.locator('#sizes [aria-pressed=true]').inner_text().startswith('Gigawatt')
    # w equals the gw profile, so the normalized address drops it.
    assert page.evaluate('location.search')=='?z=gw&v=physical&r=delivery&c=6-30&f=ranks&s=VA,AZ'
    page.locator('#copy-link').click()
    # The clipboard call settles asynchronously, and headless Chromium may
    # deny it; either way the status line has to say something.
    page.wait_for_function('document.getElementById("link-status").textContent.length>0')
    page.locator('#reset-model').click()
    # The address is rewritten on a short debounce; Reset restores the model
    # and keeps the figure and the shortlist.
    page.wait_for_function('location.search==="?f=ranks&s=VA,AZ"')
    page.locator('#w-pw').fill('40');page.locator('#w-pw').dispatch_event('input')
    page.wait_for_function('new URLSearchParams(location.search).get("w")==="40.10.10.10.10.10.10.10"')
    page.goto(uri+'?z=huge&w=abc&v=nope&r=maybe&c=9&f=zzz&s=XX,va&p=colo')
    assert page.evaluate('size')=='hyper' and page.evaluate('weights.x')==30
    assert page.evaluate('view')=='all' and page.evaluate('FIGS.active()')=='map'
    assert page.evaluate('[...shortlist]')==['VA']
    assert page.evaluate('location.search')=='?w=15.15.10.10.5.10.5.30&s=VA'
    page.goto(uri)
    assert page.evaluate('location.search')==''

    page.set_viewport_size({'width':390,'height':844})
    page.reload()
    assert not page.locator('#wpanel').evaluate('(e)=>e.open')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path=str(Path(output) / 'mobile.png'),full_page=True)
    assert not errors,errors
    print('All browser checks passed; no JS errors.')
    b.close()
