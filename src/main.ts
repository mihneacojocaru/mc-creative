import './style.css'
import {
  createIcons,
  Mail, Linkedin,
  X, Menu, ArrowDown,
  Monitor, Globe, Eye, Zap, MessageCircle, Boxes,
  MapPin, Code2, Package, Layers, CheckCircle, Wrench, Star,
  Volume2, Check, ListOrdered, ShieldCheck, Lightbulb, Users, BookOpen, Network,
} from 'lucide'
import { renderLogoWall } from './logos'

const ICONS = {
  Mail, Linkedin,
  X, Menu, ArrowDown,
  Monitor, Globe, Eye, Zap, MessageCircle, Boxes,
  MapPin, Code2, Package, Layers, CheckCircle, Wrench, Star,
  Volume2, Check, ListOrdered, ShieldCheck, Lightbulb, Users, BookOpen, Network,
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactConfig {
  readonly emailParts: readonly string[]
  readonly linkedin: string
}

// ─── Contact Config ───────────────────────────────────────────────────────────
// Email assembled at runtime — keeps plain-text address out of scraped HTML

const CONTACT: ContactConfig = {
  emailParts: ['mihnea', '.co', '@', 'web', '.de'],
  linkedin: 'https://www.linkedin.com/in/mihnea-cojocaru/',
}

// ─── PersonalSite ─────────────────────────────────────────────────────────────

class PersonalSite {
  private readonly contact: ContactConfig
  private sidebar: HTMLElement | null = null
  private overlay: HTMLElement | null = null
  private openBtn: HTMLButtonElement | null = null
  private closeBtn: HTMLButtonElement | null = null
  private clickNavTimer: number | null = null
  private isClickNavigating = false
  private resizeTimer: number | null = null

  private constructor(contact: ContactConfig) {
    this.contact = contact
  }

  // ── Icons ──────────────────────────────────────────────────────────────────

  private initIcons(): void {
    createIcons({ icons: ICONS })
  }

  // ── Contact Reveal ─────────────────────────────────────────────────────────

  private initContact(): void {
    const email = this.contact.emailParts.join('')
    const mailto = `mailto:${email}`

    document.querySelectorAll<HTMLAnchorElement>('.js-email-link').forEach(el => {
      el.href = mailto
    })
    document.querySelectorAll<HTMLElement>('.js-email-text').forEach(el => {
      el.textContent = email
    })
    document.querySelectorAll<HTMLAnchorElement>('.js-linkedin-link').forEach(el => {
      el.href = this.contact.linkedin
      el.rel = 'noopener noreferrer'
    })
  }

  // ── Mobile Drawer ──────────────────────────────────────────────────────────

  private initDrawer(): void {
    this.sidebar = document.getElementById('sidebar')
    this.overlay = document.getElementById('sidebar-overlay')
    this.openBtn = document.getElementById('sidebar-open') as HTMLButtonElement | null
    this.closeBtn = document.getElementById('sidebar-close') as HTMLButtonElement | null

    if (!this.sidebar || !this.overlay || !this.openBtn || !this.closeBtn) return

    this.openBtn.addEventListener('click', () => this.openDrawer())
    this.closeBtn.addEventListener('click', () => this.closeDrawer())
    this.overlay.addEventListener('click', () => this.closeDrawer())

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.overlay && !this.overlay.classList.contains('hidden')) {
        this.closeDrawer()
      }
    })

    // Close drawer when a nav anchor is clicked on mobile
    this.sidebar.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 1024) this.closeDrawer()
      })
    })
  }

  private openDrawer(): void {
    this.sidebar?.classList.remove('-translate-x-full')
    this.overlay?.classList.remove('hidden')
    document.body.classList.add('overflow-hidden')
    this.openBtn?.setAttribute('aria-expanded', 'true')
    setTimeout(() => this.closeBtn?.focus(), 50)
  }

  private closeDrawer(): void {
    this.sidebar?.classList.add('-translate-x-full')
    this.overlay?.classList.add('hidden')
    document.body.classList.remove('overflow-hidden')
    this.openBtn?.setAttribute('aria-expanded', 'false')
    this.openBtn?.focus({ preventScroll: true })
  }

  // ── Active Nav Highlight ───────────────────────────────────────────────────

  private initActiveNav(): void {
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-link')
    const navIds = new Set(
      Array.from(navLinks)
        .map(l => l.getAttribute('href')?.slice(1))
        .filter((id): id is string => Boolean(id)),
    )
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]')).filter(s =>
      navIds.has(s.id),
    )

    const applyActive = (id: string): void => {
      navLinks.forEach(l => l.classList.remove('nav-link--active'))
      document
        .querySelector<HTMLAnchorElement>(`.nav-link[href="#${id}"]`)
        ?.classList.add('nav-link--active')
    }

    // ── Click override ──
    // Immediately style the clicked link and pause scroll spy for 800 ms so the
    // smooth-scroll animation doesn't overwrite the selection.
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        const id = link.getAttribute('href')?.slice(1)
        if (!id) return
        applyActive(id)
        this.isClickNavigating = true
        if (this.clickNavTimer !== null) clearTimeout(this.clickNavTimer)
        this.clickNavTimer = window.setTimeout(() => {
          this.isClickNavigating = false
        }, 800)
      })
    })

    // ── Scroll spy ──
    // Finds the last section whose top has crossed 60 % of the viewport.
    // 60 % is the minimum needed on a 1080 px screen given the contact + footer
    // height (~430 px): trigger = 1 − 430/1080 ≈ 60 %.
    // For taller viewports a bottom-of-page fallback picks the last visible section.
    const setActiveFromScroll = (): void => {
      if (this.isClickNavigating) return

      const trigger = window.innerHeight * 0.6
      let current = sections[0]

      for (const section of sections) {
        if (section.getBoundingClientRect().top <= trigger) current = section
      }

      // Intro: the high trigger lets what-i-do steal focus too early.
      // Keep intro active for as long as we're physically inside it.
      if (window.scrollY < sections[0].offsetHeight) current = sections[0]

      const distFromBottom =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight
      if (distFromBottom < 4) {
        for (const section of sections) {
          if (section.getBoundingClientRect().top < window.innerHeight) current = section
        }
      }

      applyActive(current.id)
    }

    window.addEventListener('scroll', setActiveFromScroll, { passive: true })
    setActiveFromScroll()
  }

  // ── Resize Transition Guard ────────────────────────────────────────────────

  private initResizeGuard(): void {
    window.addEventListener('resize', () => {
      document.body.classList.add('is-resizing')
      if (this.resizeTimer !== null) clearTimeout(this.resizeTimer)
      this.resizeTimer = window.setTimeout(() => {
        document.body.classList.remove('is-resizing')
      }, 200)
    }, { passive: true })
  }

  // ── Footer Year ────────────────────────────────────────────────────────────

  private initFooterYear(): void {
    const el = document.getElementById('footer-year')
    if (el) el.textContent = String(new Date().getFullYear())
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  public init(): void {
    console.log(
      '%c Looking for something special? Let\'s talk about it → mihnea.co@web.de ',
      'background:#774069;color:#fff;padding:6px 12px;border-radius:4px;font-size:13px;font-weight:500;',
    )
    renderLogoWall('logo-wall')
    this.initIcons()
    this.initContact()
    this.initDrawer()
    this.initActiveNav()
    this.initResizeGuard()
    this.initFooterYear()
    document.body.classList.remove('is-resizing')
  }

  /** Factory method — preferred entry point */
  public static create(contact: ContactConfig): PersonalSite {
    const site = new PersonalSite(contact)
    site.init()
    return site
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => PersonalSite.create(CONTACT))
