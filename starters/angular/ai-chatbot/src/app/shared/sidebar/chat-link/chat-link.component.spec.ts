import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ChatLinkComponent } from './chat-link.component';
import { fetchApiMockProvider } from '../../utils/fetch-mock-provider.test-util';
import { Chat } from '../../../../model';

describe('ChatLinkComponent', () => {
  let component: ChatLinkComponent;
  let fixture: ComponentFixture<ChatLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatLinkComponent],
      providers: [provideRouter([]), fetchApiMockProvider],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatLinkComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('chat', new Chat({}));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
