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
      next: (data) => {
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
    const starCount = 3000;
    const posArray = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 100;

    starGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    this.stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ size: 0.05, color: 0xffffff }));
    this.scene.add(this.stars);

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.stars.rotation.y += 0.0003;
      this.renderer.render(this.scene, this.camera);
    };
    animate();
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onWindowResize() {
    if (!this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  openGift() {
    if (this.isOpened()) return;
    this.isOpened.set(true);

    const tl = gsap.timeline();
    tl.to('.gift-box', { duration: 0.5, scale: 0, opacity: 0, ease: 'back.in' });
    tl.to('.galaxy-overlay', { 
      duration: 0.8, 
      opacity: 1, 
      onComplete: () => this.animateElements() 
    });
  }

 private animateElements() {
  const isMobile = window.innerWidth < 768;
  const elements = gsap.utils.toArray<HTMLElement>('.floating-element');
  
  elements.forEach((el) => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    let randomX, randomY;

    if (isMobile) {
      // Mobile Safe Zone Logic: နှင်းဆီပွင့်ရှိတဲ့ အလယ်ဗဟိုကို ရှောင်မယ်
      // အပေါ်ဘက် 40% နဲ့ အောက်ဘက် 40% ဧရိယာထဲမှာပဲ ပုံတွေကို ထားမယ်
      randomX = (Math.random() - 0.5) * w * 0.85;
      
      const side = Math.random() > 0.5 ? 1 : -1; 
      // အလယ် (Center) ကနေ အပေါ် (သို့) အောက်ကို တွန်းထုတ်လိုက်တာပါ
      randomY = side * (h * 0.25 + Math.random() * h * 0.2); 
    } else {
      randomX = (Math.random() - 0.5) * w * 0.9;
      randomY = (Math.random() - 0.5) * h * 0.9;
    }
    
    gsap.set(el, { x: randomX, y: randomY, opacity: 0, scale: 0 });

    gsap.to(el, {
      opacity: 1,
      // Size ကို နည်းနည်းပြန်လျှော့ထားပါတယ် (အရမ်းကြီးမနေအောင်)
      scale: isMobile ? gsap.utils.random(0.6, 0.8) : gsap.utils.random(0.8, 1.1),
      x: `+=${gsap.utils.random(-25, 25)}`,
      y: `+=${gsap.utils.random(-25, 25)}`,
      duration: gsap.utils.random(6, 12),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: Math.random() * 2
    });
  });
}

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}