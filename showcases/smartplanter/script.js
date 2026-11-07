/**
 * SmartPlanter Portfolio Showcase - Interactive Controller & Animations
 * Powers interactive hardware simulators, CYD touch console demo, and scroll reveals.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // 2. Scroll Reveal Animations (Intersection Observer)
  const revealElements = document.querySelectorAll('.animate-reveal, .module-card, .web-card, .cyd-image-frame, .phone-mockup-frame');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // 3. Simulated Live Telemetry Stream Ticker (2 Hz packet clock)
  let packetSeq = 1842;
  const termSeq = document.getElementById('term-seq');
  const termTemp = document.getElementById('term-temp');
  const cydClock = document.getElementById('cyd-clock');

  // Update clock
  const updateClock = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    if (cydClock) cydClock.textContent = `${hours}:${mins}`;
  };
  updateClock();
  setInterval(updateClock, 30000);

  // 2 Hz Telemetry Packet Jitter Loop
  setInterval(() => {
    packetSeq++;
    if (termSeq) termSeq.textContent = packetSeq;

    // Subtle realistic temperature jitter (21.35 - 21.45 C)
    const jitterTemp = (21.4 + (Math.sin(packetSeq * 0.2) * 0.08)).toFixed(2);
    if (termTemp) termTemp.textContent = `${jitterTemp} °C`;
  }, 500);

  // 4. Interactive CYD Display UI Simulator (Tab Switching)
  const cydTabs = document.querySelectorAll('.cyd-tab-btn');
  const cydViews = document.querySelectorAll('.cyd-view');

  cydTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Update button states
      cydTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update view states
      cydViews.forEach(view => {
        view.classList.remove('active');
        if (view.id === `cyd-view-${targetTab}`) {
          view.classList.add('active');
        }
      });
    });
  });

  // CYD in-screen quick action buttons
  const cydBtnDip = document.getElementById('cyd-btn-dip');
  if (cydBtnDip) {
    cydBtnDip.addEventListener('click', () => {
      triggerServoDip();
    });
  }

  const cydBtnTransfer = document.getElementById('cyd-btn-transfer');
  if (cydBtnTransfer) {
    cydBtnTransfer.addEventListener('click', () => {
      pulseWaterTransfer();
    });
  }

  // CYD Planter water buttons
  document.querySelectorAll('.cyd-water-btn').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      btn.textContent = 'Watering...';
      btn.style.background = '#10b981';
      btn.style.color = '#fff';

      setTimeout(() => {
        btn.textContent = 'Water';
        btn.style.background = '';
        btn.style.color = '';
      }, 2500);
    });
  });

  // 5. Interactive Sandbox / Live Hardware Simulator
  const p1Slider = document.getElementById('sim-p1-slider');
  const p1Display = document.getElementById('sim-p1-moist-display');
  const p1PumpBadge = document.getElementById('sim-p1-pump-badge');
  const termP1 = document.getElementById('term-p1');
  const termP1Pump = document.getElementById('term-p1-pump');

  const p2Slider = document.getElementById('sim-p2-slider');
  const p2Display = document.getElementById('sim-p2-moist-display');
  const p2PumpBadge = document.getElementById('sim-p2-pump-badge');
  const termP2 = document.getElementById('term-p2');
  const termP2Pump = document.getElementById('term-p2-pump');

  // Planter 1 slider listener
  if (p1Slider) {
    p1Slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const isDry = val < 45; // target is 45%

      p1Display.textContent = isDry 
        ? `${val}% (Dry • Auto-Irrigation Triggered)` 
        : `${val}% (Optimal • Moist)`;
      
      p1Display.style.color = isDry ? '#f59e0b' : '#34d399';

      if (isDry) {
        p1PumpBadge.textContent = 'Pump 1: ACTIVE';
        p1PumpBadge.className = 'pump-indicator on';
        if (termP1Pump) {
          termP1Pump.textContent = 'true (AUTO)';
          termP1Pump.className = 'val highlight';
        }
      } else {
        p1PumpBadge.textContent = 'Pump 1: STANDBY';
        p1PumpBadge.className = 'pump-indicator off';
        if (termP1Pump) {
          termP1Pump.textContent = 'false';
          termP1Pump.className = 'val';
        }
      }

      if (termP1) termP1.textContent = `${val} %`;
    });
  }

  // Planter 2 slider listener
  if (p2Slider) {
    p2Slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const isDry = val < 50; // target is 50%

      p2Display.textContent = isDry 
        ? `${val}% (Dry • Auto-Irrigation Triggered)` 
        : `${val}% (Optimal • Moist)`;
      
      p2Display.style.color = isDry ? '#f59e0b' : '#34d399';

      if (isDry) {
        p2PumpBadge.textContent = 'Pump 2: ACTIVE';
        p2PumpBadge.className = 'pump-indicator on';
        if (termP2Pump) {
          termP2Pump.textContent = 'true (AUTO)';
          termP2Pump.className = 'val highlight';
        }
      } else {
        p2PumpBadge.textContent = 'Pump 2: STANDBY';
        p2PumpBadge.className = 'pump-indicator off';
        if (termP2Pump) {
          termP2Pump.textContent = 'false';
          termP2Pump.className = 'val';
        }
      }

      if (termP2) termP2.textContent = `${val} %`;
    });
  }

  // 6. Servo pH Probe Dip Mechanism Trigger
  const btnTriggerServo = document.getElementById('btn-trigger-servo');
  const rigServoArm = document.getElementById('rig-servo-arm');
  const rigServoAngle = document.getElementById('rig-servo-angle');
  const termDipping = document.getElementById('term-dipping');
  const termPh = document.getElementById('term-ph');
  let isDipping = false;

  const triggerServoDip = () => {
    if (isDipping) return;
    isDipping = true;

    // Trigger dipping animation
    if (rigServoArm) rigServoArm.classList.add('dipped');
    if (rigServoAngle) rigServoAngle.innerHTML = '115&deg; <span style="color:#38bdf8">(Submerged &bull; Reading)</span>';
    if (termDipping) {
      termDipping.textContent = 'true (ACTIVE)';
      termDipping.className = 'val highlight';
    }
    if (btnTriggerServo) {
      btnTriggerServo.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Dipping in progress (6s)...';
      if (window.lucide) lucide.createIcons();
    }

    // Stabilized reading simulated fluctuation
    let cycleCount = 0;
    const readInterval = setInterval(() => {
      cycleCount++;
      const currentReading = (6.58 + Math.random() * 0.08).toFixed(2);
      if (termPh) termPh.textContent = `${currentReading} pH`;
    }, 400);

    // After 6000ms (SERVO_DIP_DURATION_MS), retract arm safely
    setTimeout(() => {
      clearInterval(readInterval);
      if (rigServoArm) rigServoArm.classList.remove('dipped');
      if (rigServoAngle) rigServoAngle.innerHTML = '15&deg; <span>(Retracted &bull; Safe)</span>';
      if (termDipping) {
        termDipping.textContent = 'false';
        termDipping.className = 'val';
      }
      if (termPh) termPh.textContent = '6.62 pH';
      if (btnTriggerServo) {
        btnTriggerServo.innerHTML = '<i data-lucide="refresh-cw"></i> Dip pH Servo Probe (6s Cycle)';
        if (window.lucide) lucide.createIcons();
      }
      isDipping = false;
    }, 6000);
  };

  if (btnTriggerServo) {
    btnTriggerServo.addEventListener('click', triggerServoDip);
  }

  // 7. Pulse Fresh Water Transfer Pump
  const btnTriggerTransfer = document.getElementById('btn-trigger-transfer');
  const rigFlowParticle = document.getElementById('rig-flow-particle');
  const rigTransferBadge = document.getElementById('rig-transfer-badge');
  const rigWaterT1 = document.getElementById('rig-water-t1');
  const rigWaterT2 = document.getElementById('rig-water-t2');
  let isTransferring = false;

  const pulseWaterTransfer = () => {
    if (isTransferring) return;
    isTransferring = true;

    if (rigFlowParticle) rigFlowParticle.classList.add('active');
    if (rigTransferBadge) {
      rigTransferBadge.textContent = 'Pumping (Active)';
      rigTransferBadge.style.color = '#38bdf8';
    }
    if (btnTriggerTransfer) {
      btnTriggerTransfer.innerHTML = '<i data-lucide="waves"></i> Transferring Water...';
      if (window.lucide) lucide.createIcons();
    }

    setTimeout(() => {
      if (rigFlowParticle) rigFlowParticle.classList.remove('active');
      if (rigTransferBadge) {
        rigTransferBadge.textContent = 'Pump Idle';
        rigTransferBadge.style.color = '';
      }
      if (btnTriggerTransfer) {
        btnTriggerTransfer.innerHTML = '<i data-lucide="shuffle"></i> Pulse Fresh Water Transfer';
        if (window.lucide) lucide.createIcons();
      }
      isTransferring = false;
    }, 3500);
  };

  if (btnTriggerTransfer) {
    btnTriggerTransfer.addEventListener('click', pulseWaterTransfer);
  }

  // 8. Code Inspector Tab Switching
  const codeTabs = document.querySelectorAll('.code-tab');
  const codeBlocks = document.querySelectorAll('.code-block');

  codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetCode = tab.getAttribute('data-code');

      codeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      codeBlocks.forEach(block => {
        block.classList.remove('active');
        if (block.id === `code-${targetCode}`) {
          block.classList.add('active');
        }
      });
    });
  });

  // 9. Smooth scrolling for internal anchor links (with sticky nav offset)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 70;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // 10. PostMessage for seamless parent iFrame auto-resizing
  const sendHeightToParent = () => {
    if (window.parent && window.parent !== window) {
      const height = document.documentElement.scrollHeight || document.body.scrollHeight;
      window.parent.postMessage({ type: 'SMARTPLANTER_HEIGHT', height: height }, '*');
    }
  };

  window.addEventListener('load', sendHeightToParent);
  window.addEventListener('resize', sendHeightToParent);
  setTimeout(sendHeightToParent, 600);
});
