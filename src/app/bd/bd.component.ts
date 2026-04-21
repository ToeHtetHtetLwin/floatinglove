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

  // States
  isOpened = signal<boolean>(false);
  customerData = signal<any>(null);
  isLoading = signal<boolean>(true); // Loading state ထည့်ထားပါတယ်

  // Three.js Variables
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
      error: (err:any) => {
        console.error('Data load error:', err);
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
    tl.to('.gift-box', { duration: 0.6, scale: 0, opacity: 0, ease: 'back.in(1.7)' });
    tl.set('.galaxy-overlay', { display: 'flex' });
    tl.to('.galaxy-overlay', { duration: 1, opacity: 1, onComplete: () => this.animateElements() });
  }

  private animateElements() {
    gsap.utils.toArray<HTMLElement>('.floating-element').forEach((el) => {
      const randomX = (Math.random() - 0.5) * window.innerWidth * 0.9;
      const randomY = (Math.random() - 0.5) * window.innerHeight * 0.9;
      gsap.set(el, { x: randomX, y: randomY, opacity: 0, scale: 0 });

      gsap.to(el, {
        opacity: 1,
        scale: gsap.utils.random(0.7, 1.2),
        x: `+=${gsap.utils.random(-60, 60)}`,
        y: `+=${gsap.utils.random(-60, 60)}`,
        rotation: 'random(-15, 15)',
        duration: gsap.utils.random(8, 15),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 1.5
      });
    });
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}