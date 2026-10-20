import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react-native';
import {MerchantButton} from '../src/components/MerchantButton';
import {openProductLink} from '../src/platform/links';
const mockQuery=jest.fn(),mockOpen=jest.fn();
jest.mock('convex/react',()=>({useQuery:(...args:unknown[])=>mockQuery(...args)}));
jest.mock('../src/providers/Backend',()=>({useBackend:()=>({config:{url:'https://sample.convex.cloud'}})}));
jest.mock('expo-web-browser',()=>({openBrowserAsync:(...args:unknown[])=>mockOpen(...args)}));
const url='https://www.amazon.in/dp/B012345678';
const affiliate={reference:{kind:'guest' as const,token:'invented',url},source:'guest-search' as const};
beforeEach(()=>{jest.clearAllMocks();mockOpen.mockResolvedValue({type:'cancel'});mockQuery.mockReturnValue(undefined);});
test('opens signed link and returns from native browser with the card usable',async()=>{
 const href='https://sample.convex.site/go?token=abc.def';
 mockQuery.mockReturnValue({href,affiliate:true,amazon:true});
 await render(<MerchantButton url={url} affiliate={affiliate}/>);
 expect(screen.getByText(/As an Amazon Associate/)).toBeTruthy();
 await fireEvent.press(screen.getByRole('button',{name:'Open on store'}));
 await waitFor(()=>expect(mockOpen).toHaveBeenCalledWith(href));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Open on store'})).toBeEnabled());
 expect(mockQuery.mock.calls[0][1]).toEqual(affiliate);
});
test('uses plain fallback while loading and when affiliate setup is absent',async()=>{
 const view=await render(<MerchantButton url={url} affiliate={affiliate}/>);
 await fireEvent.press(screen.getByRole('button',{name:'Open on store'}));
 await waitFor(()=>expect(mockOpen).toHaveBeenCalledWith(url));
 mockQuery.mockReturnValue({href:url,affiliate:false,amazon:false});
 await view.rerender(<MerchantButton url={url} affiliate={affiliate}/>);
 expect(screen.queryByText(/commission/)).toBeNull();
});
test('rejected reference cannot open the original URL',async()=>{
 mockQuery.mockReturnValue(null);
 await render(<MerchantButton url={url} affiliate={affiliate}/>);
 expect(screen.getByRole('button',{name:'Open on store'})).toBeDisabled();
 await fireEvent.press(screen.getByRole('button',{name:'Open on store'}));
 expect(mockOpen).not.toHaveBeenCalled();
});
test('untrusted destination never reaches browser and shows recoverable error',async()=>{
 mockQuery.mockReturnValue({href:'https://evil.example',affiliate:false});
 await render(<MerchantButton url={url} affiliate={affiliate}/>);
 await fireEvent.press(screen.getByRole('button',{name:'Open on store'}));
 await waitFor(()=>expect(screen.getByText(/store link is not supported/)).toBeTruthy());
 expect(mockOpen).not.toHaveBeenCalled();
});
test('native browser rejects another deployment’s redirect',async()=>{
 await expect(openProductLink('https://other.convex.site/go?token=abc.def','https://sample.convex.cloud')).rejects.toThrow();
 expect(mockOpen).not.toHaveBeenCalled();
});
