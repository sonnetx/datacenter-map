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
            for tab in ['overview','scores','sources']:
                page.locator('#tab-'+tab).click()
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,state,tab)
                assert page.locator('#state-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),(width,state,tab,'dialog overflow')
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
    page.set_viewport_size({'width':390,'height':844})
    page.reload()
    assert not page.locator('#wpanel').evaluate('(e)=>e.open')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path=str(Path(output) / 'mobile.png'),full_page=True)
    assert not errors,errors
    print('All browser checks passed; no JS errors.')
    b.close()
