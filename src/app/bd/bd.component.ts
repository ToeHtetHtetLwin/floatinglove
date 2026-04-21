import { Component, ElementRef, ViewChild, AfterViewInit, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import * as THREE from 'three';
import { gsap } from 'gsap';

@Component({
  selector: 'app-bd',
  standalone: true,
  templateUrl: './bd.component.html',
  styleUrl: './bd.component.css',
})
export class BdComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  isOpened = signal<boolean>(false);
  customerData = signal<any>(null);
  isLoading = signal<boolean>(true);

  private scene = new THREE.Scene();
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private stars!: THREE.Points;
  private animationId!: number;

  ngOnInit() {
    this.loadCustomerData();
  }

  private loadCustomerData() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<any[]>('/customers.json').subscribe({
      next: (data: any[]) => {
        const found = data.find((c: any) => c.id === id);
        this.customerData.set(found || null);
        this.isLoading.set(false);
      },
      error: () => {
        this.customerData.set(null);
        this.isLoading.set(false);
      }
    });
  }

  ngAfterViewInit() {
    this.initThreeJS();
  }

  private initThreeJS() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const posArray = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 100;

    starGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    this.stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ size: 0.05, color: 0xffffff }));
    this.scene.add(this.stars);

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.stars.rotation.y += 0.0005;
      this.stars.rotation.x += 0.0002;
      this.renderer.render(this.scene, this.camera);
    };
    animate();
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  openGift() {
    if (this.isOpened() || !this.customerData()) return;
    this.isOpened.set(true);

    const tl = gsap.timeline();
    // Gift Box ကို ပျောက်အောင်လုပ်
    tl.to('.gift-box', { duration: 0.6, scale: 0, opacity: 0, ease: 'back.in(1.7)' });
    
    // Overlay ကို ဖော်မယ် (autoAlpha က display: none ကိုပါ handle လုပ်ပေးပါတယ်)
    tl.to('.galaxy-overlay', { 
      duration: 1, 
      autoAlpha: 1, 
      onComplete: () => this.animateElements() 
    });
  }

private animateElements() {
  const elements = gsap.utils.toArray<HTMLElement>('.floating-element');
  
  elements.forEach((el) => {
    // Screen size အလိုက် range ကို သတ်မှတ်မယ်
    const isMobile = window.innerWidth < 768;
    
    // Mobile မှာဆိုရင် အနားသတ်တွေနဲ့ မထိအောင် 80% area အတွင်းမှာပဲ ပျံ့စေမယ်
    // Desktop မှာဆိုရင် 90% area အထိ သုံးမယ်
    const spreadFactor = isMobile ? 0.8 : 0.9;
    
    const randomX = (Math.random() - 0.5) * window.innerWidth * spreadFactor;
    const randomY = (Math.random() - 0.5) * window.innerHeight * spreadFactor;
    
    // ပုံတွေကို အစမှာ ပျောက်ထားပြီး နေရာချမယ်
    gsap.set(el, { 
      x: randomX, 
      y: randomY, 
      opacity: 0, 
      scale: 0,
      zIndex: Math.floor(Math.random() * 10) // တစ်ခုနဲ့တစ်ခု ထပ်နေရင်တောင် အစီအစဉ်မပျက်အောင်
    });

    // Animation စတင်မယ်
    gsap.to(el, {
      opacity: 1,
      scale: isMobile ? gsap.utils.random(0.5, 0.8) : gsap.utils.random(0.7, 1.2), // Mobile မှာ ပုံနည်းနည်း သေးပေးမယ်
      x: `+=${gsap.utils.random(-30, 30)}`, // Floating ဖြစ်နေတဲ့ range ကို နည်းနည်းလျှော့လိုက်တယ် (တည်ငြိမ်အောင်)
      y: `+=${gsap.utils.random(-30, 30)}`,
      rotation: 'random(-10, 10)',
      duration: gsap.utils.random(4, 8), // လှုပ်ရှားမှုကို ပိုသိသာအောင် speed နည်းနည်းတင်ထားတယ်
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: Math.random() * 2 // တစ်ပြိုင်နက်ကြီး ပေါ်မလာဘဲ တစ်ခုချင်းစီ ထွက်လာအောင်
    });
  });
}
  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}