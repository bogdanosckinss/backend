import { Injectable, StreamableFile } from '@nestjs/common';
import { DbService } from '../db/db.service'
import { ProfileDTO } from './dto/profile-d-t-o';
import { createReadStream } from 'fs';
import {writeFile} from 'fs';
import { promisify } from 'util';

@Injectable()
export class ContentService {
  constructor(private dbService: DbService) {}

  async updateVideoModerationStatus(data): Promise<any> {
    let dataToUpdate = {
      under_moderation: false,
      allowed: data.allowed
    }

    if (data.allowed) {
      dataToUpdate['preview_url'] = data?.previewImage ?? ''
    }

    return this.dbService.video.update({
      data: dataToUpdate,
      where: {
        id: data.videoId
      }
    })
  }


  async deleteVideo(videoId: string): Promise<any> {
    return this.dbService.video.update({
      where: {
        id: parseInt(videoId)
      },
      data: {
        under_moderation: false,
        allowed: false,
        deleted: true
      }
    })
  }

  async uploadContent(userId: number, data: ProfileDTO, videoId: number): Promise<any> {
    return this.dbService.user.update({
      where: {
        id: userId
      },
      data: {
        image: data.image,
        name: data.name,
        lastname: data.lastname,
        phone_number: data.phone_number.toString(),
        email: data.email,
        city: data.city,
        social_media_link: data.social_media_link,
        age: parseInt(String(data.age)),
        videos: {
          connect: {
            id: videoId
          }
        }
      },
    })
  }

  async uploadSong(data: any): Promise<any> {
    return this.dbService.song.create({
      data: {
        ...data
      }
    })
  }

  async getSongs(): Promise<any> {
    return this.dbService.song.findMany({
      orderBy: {
        id: 'desc'
      }
    })
  }

  async getVideosToModerate(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE NOT video.allowed AND video.under_moderation IS TRUE AND NOT video.deleted
    ORDER BY video.created_at ASC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getDeclinedVideos(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE NOT video.allowed AND NOT video.under_moderation AND NOT video.deleted
    ORDER BY video.created_at DESC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getDeclinedVideosCount(): Promise<any> {
    const declinedVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE NOT video.allowed AND NOT video.under_moderation AND NOT video.deleted`

    const acceptedVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE video.allowed IS TRUE AND NOT video.under_moderation AND NOT video.deleted`

    const underModerationVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE NOT video.allowed AND video.under_moderation IS TRUE AND NOT video.deleted`

    const totalModerationVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video WHERE NOT video.deleted`

    if (!declinedVideosCount || declinedVideosCount == 'unknown') {
      return 0
    }

    // @ts-ignore
    return {
      accepted: parseInt(acceptedVideosCount[0]?.counttoshow ?? 0),
      declined: parseInt(declinedVideosCount[0]?.counttoshow ?? 0),
      underModeration: parseInt(underModerationVideosCount[0]?.counttoshow ?? 0),
      total: parseInt(totalModerationVideosCount[0]?.counttoshow ?? 0)
    }
  }

  async getApprovedVideos(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE video.allowed IS TRUE AND video.under_moderation IS FALSE
    ORDER BY video.id DESC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getContent(id: number): Promise<any> {
    return {};
    // return this.dbService.video.findMany({
    //   //take: 3, // TODO: remove
    //   where: {
    //     id: {
    //       not: {
    //         lt: 6
    //       }
    //     },
    //     under_moderation: false,
    //     allowed: true
    //   },
    //   orderBy: {
    //     videoLikes: {
    //       _count: 'desc'
    //     }
    //   },
    //   include: {
    //     users: true,
    //     song: true,
    //     videoLikes: {
    //       select: {
    //         id: true,
    //         video_id: true,
    //         user: {
    //           select: {
    //             id: true,
    //           },
    //         },
    //       },
    //     }
    //   }
    // })
  }

  async findManyVideosByUsername(skip: string, query: string, userId: number, startVideoId: string): Promise<any> {
    const queryToUse = query == 'null' ? '' : query
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id AND videoLike.user_id = ${userId}) as is_liked_by_me, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id) as video_likes from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE video.allowed AND (LOWER(CONCAT(userc.lastname, ' ', userc.name)) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(CONCAT(userc.name, ' ', userc.lastname)) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(userc.name) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(ss.title) LIKE LOWER(${'%' + queryToUse + '%'}))
    ORDER BY (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id) DESC, video.created_at ASC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
        video_likes: '',
        is_liked_by_me: parseInt(video.is_liked_by_me) > 0,
        videoLikes: parseInt(video.video_likes)
      }
    })
  }

  async cleanUsers(query: string): Promise<any> {
    // let data = ''
    // readXlsxFile('/Users/bohdanoskin/Documents/Other/extreme/domains/backend/src/content/ert.xlsx').then(rows => {
    //   for (const row in rows) {
    //     data += ('"' + rows[row][0] + '",\n')
    //   }
    //   this.createFile('/Users/bohdanoskin/Documents/Other/extreme/domains/backend/src/content', 'er.txt', data);
    // })
    //
    // return
    // const queryToUse = query == 'null' ? '' : query
    // if (queryToUse == '') {
    //   return {}
    // }

    return await this.dbService.$queryRaw`
        Delete from users as usr
        WHERE usr.email IN(
                           'yemeb93944@janfab.com',
                           'testix@gmail.com',
                           'gfhfgd@gmail.com',
                           'qewrwer@gmail.com',
                           'gfdhfgdh@gmail.com',
                           'nkbrzhn@gmail.com',
                           'sjulf@santajulf.ru',
                           'sjulf@rambler.ru',
                           'd30394015@gmail.com',
                           'oe273130@gmail.com',
                           'filatovavarvara1104@gmail.com',
                           'santajulf@gmail.com',
                           'v92296416@gmail.com',
                           'peiappae@gmail.com',
                           'petrovaalisa270715@gmail.com',
                           'anastasiatihonina70@gmail.com',
                           'anastasiatihonina52@gmail.com',
                           'a.maximova15@mail.ru',
                           't37272996@gmail.com',
                           'd1634954@gmail.com',
                           'ulya.khz.39@mail.ru',
                           'kna8279@yandex.ru',
                           'netuima80@gmail.com',
                           'e.cherdyntseva@list.ru',
                           'j-x32hj72009@mail.ru',
                           'danalajt5@gmail.com',
                           'kmarina.2017@mail.ru',
                           'd77773473@gmail.com',
                           'volbergulia@gmail.com',
                           'olgamanik38@gmail.com',
                           'dmila266@gmail.com',
                           'polilove@gmail.com',
                           'nadya.korneva2601@gmail.com',
                           'tihoninaleksej35@gmail.com',
                           'lissolya@list.ru',
                           'kirillouacofla@gmail.com',
                           'p93528440@gmail.com',
                           'zdorovoe-nastroenie@yandex.ru',
                           '89185138204@mail.ru',
                           'honorov331@gmail.com',
                           'moiseeva.luba.okt@gmail.com',
                           'd47322907@gmail.com',
                           'maria16smirnoff13@gmail.com',
                           'tiok6235@gmail.com',
                           'chukdan103@gmail.com',
                           'sergeykadr087@gmail.com',
                           'chaniduk5252@gmail.com',
                           'granga011282@gmail.com',
                           'alina.petrash0906@mail.ru',
                           'd9811391044@mail.ru',
                           'santeic0rambler0ru@gmail.com',
                           'es6837161@gmail.com',
                           'kivamos154@degcos.com',
                           'lihalil471@cetnob.com',
                           'kesam93670@degcos.com',
                           'leraja5742@cetnob.com',
                           'tayihix387@degcos.com',
                           'wesevy@polkaroad.net',
                           'dmcmu567@dygovil.com',
                           'prov7@dygovil.com',
                           'kristina@yopmail.com',
                           'alvi_lik@yopmail.com',
                           'm6928959@gmail.com',
                           'margaritka27072012@gmail.com',
                           'tonas5689@gmail.com',
                           'a43310904@gmail.com',
                           'pisakinai21@gmail.com',
                           'da3557676@gmail.com',
                           'alisasolnceva63@gmail.com',
                           'alexfroyzav2013@yandex.ru',
                           'matsnevanika@gmail.com',
                           'ivanova_olga_12@inbox.ru',
                           'artyr185@mail.ru',
                           'simaginaulia89@gmail.com',
                           'izotovvva.valeria@yandex.ru',
                           'konevaekaterina@bk.ru',
                           '195590069lili@gmail.com',
                           'anna21_13@mail.ru',
                           'zlata20120609@yandex.ru',
                           'guitarbnc@gmail.com',
                           'n2952480@gmail.com',
                           '123tes4iv@gmail.com',
                           'zixibabo@teleg.eu',
                           '019lama@gonetor.com',
                           'aleks35@zvvzuv.com',
                           'pavelnabokov@bltiwd.com',
                           'md225nvihn@somelora.com',
                           'ksunaalavki3738@rambler.ru',
                           '-',
                           'polinkamandarinkkaa4560@rambler.ru',
                           'milalalivova4676@rambler.ru',
                           'timycistarrrr@rambler.ru',
                           'chris.gentle7@marketemail.org',
                           'skyler.happy@marketemail.org',
                           'phoenix.mighty45@plusxmail.org',
                           'logan.brilliant75@oscartop.org',
                           'logan.vibrant99@marketemail.org',
                           'riley.brave4@privatejuliet.org',
                           'charlie.brave28@nestxmail.org',
                           'reese.brave82@marketemail.org',
                           'riley.peaceful17@zonebmail.org',
                           'dakota.fine60@labsemail.org',
                           'huxdzc9jih@wywnxa.com',
                           'tqaqnan948@somelora.com',
                           'qugyrome@clip.lat',
                           'lexahaci@teleg.eu',
                           'honavajy@teleg.eu',
                           'pedotu@clip.lat',
                           'likiropy@pelagius.net',
                           'xikezole@clip.lat',
                           'lorima@teleg.eu',
                           'kristina34@rfcdrive.com',
                           'jyzoqovo@pelagius.net',
                           'sasha744@tippabble.com',
                           'jucako@citmo.net',
                           'svetlana355@vvatxiy.com',
                           'ruvetewe@polkaroad.net',
                           'ninochka25@tidissajiiu.com',
                           'pilify@citmo.net',
                           'tolik.petrov@bltiwd.com',
                           'ktopnikova@mail.ru',
                           'julybere@teleg.eu',
                           'olya95@dygovil.com',
                           'sugafa@clip.lat',
                           'fijijay110@nastyx.com',
                           'kristina2007@zvvzuv.com',
                           'grisha053@somelora.com',
                           'angelina32@gonetor.com',
                           'xosayeb156@sigmazon.com',
                           'pavel02@gonetor.com',
                           'klimovapv@yandex.ru',
                           'nadej.larkina@gmail.com',
                           'ailanasertekova2011@gmail.com',
                           'a76068009@gmail.com',
                           'elset.ls@yandex.ru',
                           'natalkashal@mail.ru',
                           'ksusadavydova750@gmail.com',
                           'ivazhmonkyyn3883@rambler.ru',
                           'vladkopnin2234@rambler.ru',
                           'alinaxaitseva2349@rambler.ru',
                           'artempetrov4378@rambler.ru',
                           'vikapomakova4689@rambler.ru',
                           'maryabelonogova5567@rambler.ru',
                           'antonina7661@rambler.ru',
                           'dasha215@smykwb.com',
                           'a8aceddb48@mailmaxy.one',
                           'qwertyasd12le@gmail.com',
                           'wotedi4606@cetnob.com',
                           'labey41177@cetnob.com',
                           'lf20l5fyvz@zvvzuv.com',
                           'irakoshkuna456@myrambler.ru',
                           'pervirrare1976@mail.ru',
                           'artemivanov53100@gmail.com',
                           'vaclavakostina19683063@inbox.ru',
                           'bolshakovadebora74831@mail.ru',
                           'kononovatxw1975@mail.ru',
                           'vika_fomina_1996@bk.ru',
                           'oafsauwkdpbml4v@list.ru',
                           'wztxfuhednyjedp@list.ru',
                           'asnr6i2nalgg53lfg0@list.ru',
                           'kazakovakira4570@rambler.ru',
                           'setkovanat4678@rambler.ru',
                           'nataliazavolz7924@rambler.ru',
                           'irinazvlzye4589@rambler.ru',
                           'nekitavlzhye9329@rambler.ru',
                           'ilushaaamakarev3468@rambler.ru',
                           'b0e3489a06@mailmaxy.one',
                           'jocare9857@ofionk.com',
                           'wevovi8227@ofionk.com',
                           'jawom31540@marchub.com',
                           'tanevo2336@sigmazon.com',
                           'lovafogo@teleg.eu',
                           'vosilox993@sigmazon.com',
                           'lototi4164@nastyx.com',
                           'jecav40113@sigmazon.com',
                           'r1kwpyuug6@vafyxh.com',
                           'mefiwe4408@marchub.com',
                           'u3mxxf2dxw@vvatxiy.com',
                           'zikmat@smykwb.com',
                           'malalike@teleg.eu',
                           'daz20p93e8@somelora.com',
                           'fobekem748@nastyx.com',
                           'pavlik795@smykwb.com',
                           'ttqv5msk9h@qzueos.com',
                           '9wo3cuw65m@qejjyl.com',
                           'somya.mil@tippabble.com',
                           'xegohom631@marchub.com',
                           'ydc79gk4nt@vafyxh.com',
                           'coumdh9a64@qacmjeq.com',
                           'igorkosha@smykwb.com',
                           'c049czrmtx@vafyxh.com',
                           'oleg.sivak@dygovil.com',
                           'qz4lvhblpc@rfcdrive.com',
                           'vexevej683@sigmazon.com',
                           '8xx4e53vfw@vvatxiy.com',
                           'ib5lu8b3qk@rfcdrive.com',
                           'arina745@smykwb.com',
                           'pbgzt0gfve@vafyxh.com',
                           '3yznxqj8ks@bltiwd.com',
                           'mifebok234@nastyx.com',
                           'f4v2aehs7y@rfcdrive.com',
                           'nqz8qnjasd@dygovil.com',
                           'emn1sltcfk@bltiwd.com',
                           'timo15vigr@rfcdrive.com',
                           'sohayan254@sigmazon.com',
                           'es6091ouwd@bltiwd.com',
                           'xlkmokw09r@wywnxa.com',
                           'kumtdt2idt@zvvzuv.com',
                           'kbxqmtnnoh@rfcdrive.com',
                           'masha12775@zlorkun.com',
                           '4gon0jrvjt@rfcdrive.com',
                           '0rmc6lk9wb@smykwb.com',
                           'miss13579246810@gmail.com',
                           'te9m58lgms@knmcadibav.com',
                           'elanagrigoreva1995@list.ru',
                           'omehinaa@shtrih-m.ru',
                           's62583416@gmail.com',
                           'd7944963@gmail.com',
                           '3hdzxtl92o@rfcdrive.com',
                           'david.gapalov@vafyxh.com',
                           '4uuvxs7jw0@rfcdrive.com',
                           't75a0bru9e@vvatxiy.com',
                           'serega3475@qejjyl.com',
                           'zeduveno@logsmarter.net',
                           'pdsnq4oso3@gonetor.com',
                           'nqinv8rb5f@somelora.com',
                           'thydppcqmi@tidissajiiu.com',
                           'vajycygy@logsmarter.net',
                           'lflcm180x1@somelora.com',
                           '2w8ayum0wj@qacmjeq.com',
                           'nina.pirova@vvatxiy.com',
                           'ljpkf54flw@vafyxh.com',
                           'kvuhdvxfu4ufyccw@list.ru',
                           '33ty7w8fft@qejjyl.com',
                           'qql686dlld@qzueos.com',
                           'v2dwc3ewuu@zlorkun.com',
                           'kostya5654@qacmjeq.com',
                           'uxe6mm3cwe@smykwb.com',
                           '2d32hsj46w@zvvzuv.com',
                           'h2nfegtzmp@dygovil.com',
                           'jn46n38ptz@bltiwd.com',
                           '4n2z1bpppe@dygovil.com',
                           'dultd4l97a@tidissajiiu.com',
                           'ehm6gvbyvz@knmcadibav.com',
                           'cwmhzyffs2@dygovil.com',
                           'gwd3ua6vda@rfcdrive.com',
                           '4n55t8wcc5@somelora.com',
                           'oaamqstewc@tippabble.com',
                           '6oh51won1h@bltiwd.com',
                           'zszjpy26f3@tippabble.com',
                           '8r1xy1y7o1@qzueos.com',
                           'g7k1glgexv@dygovil.com',
                           'a2a395talm@gonetor.com',
                           'ti3dxbm7lb@qzueos.com',
                           'ch4vakgljz@zlorkun.com',
                           'jukoviliodor4475@list.ru',
                           'y72ixdedu2@bltiwd.com',
                           'irara1pm86@zvvzuv.com',
                           '0v0qrop6e9@smykwb.com',
                           'pc9njfyh3b@tippabble.com',
                           'vinogradovdanilo1563@list.ru',
                           'wnrky76gea@tippabble.com',
                           'n58tqd1btt@rfcdrive.com',
                           'wrq8u8jd6o@knmcadibav.com',
                           'zlatikaiiis457@rambler.ru',
                           '5ahlnkmaxa@wywnxa.com',
                           'tq0zfd2gdw@qejjyl.com',
                           'nyxl1v5c6i@gonetor.com',
                           'zu3cqaghfk@tidissajiiu.com',
                           'pyd4c4qwi9@qzueos.com',
                           '0xabob6jv0@zvvzuv.com',
                           'iisskq8bpl@vafyxh.com',
                           'yg2bxw7abm@smykwb.com',
                           'tyyyqwfjit@bltiwd.com',
                           's10g2jdr64@rfcdrive.com',
                           'c8xmi6u5eg@tippabble.com',
                           'p3keu30a5v@qzueos.com',
                           '18rgdu066w@zvvzuv.com',
                           'focw7fi2vj@qzueos.com',
                           'qive6ookao@qejjyl.com',
                           'rkaqjgrpzt@somelora.com',
                           'ubxzd3lviy@vafyxh.com',
                           'qsvc84fl1h@qzueos.com',
                           'natashatutt4688@rambler.ru',
                           '3f9cc0gp3w@knmcadibav.com',
                           'g2ah1w6neq@qejjyl.com',
                           'vwh2e8861g@qacmjeq.com',
                           '2aa727wkj8@knmcadibav.com',
                           '0hf3i39i5f@tidissajiiu.com',
                           'icwryltgdo@qejjyl.com',
                           '5565xf8zuw@vvatxiy.com',
                           'f3ebaxjz4q@qacmjeq.com',
                           'natikloginiva46@rambler.ru',
                           'sa0h7g7r3q@somelora.com',
                           'sqr9kwut6f@qacmjeq.com',
                           '08848hv6oo@tidissajiiu.com',
                           '8vcf8k3w4q@vvatxiy.com',
                           'zlatituuuttzn57@rambler.ru',
                           'jbqeeby26z@wywnxa.com',
                           'sov25pivgb@qzueos.com',
                           '2hc7skdaoq@qzueos.com',
                           'rir9w2f863@rfcdrive.com',
                           'ecshpd5f18@zvvzuv.com',
                           '0hwln7utwx@rfcdrive.com',
                           'iaaasturrzlatik@rambler.ru',
                           'v6340lj0rn@zlorkun.com',
                           'hwkk8paits@tippabble.com',
                           'r70uv752hw@qacmjeq.com',
                           'i4ia13aa6c@rfcdrive.com',
                           'iiituuziixb46@rambler.ru',
                           'goht4kst6e@qzueos.com',
                           '4mzx7v8qlp@wywnxa.com',
                           'kf8j81jmqz@gonetor.com',
                           '0u4an7ynvb@rfcdrive.com',
                           'uprv3lsu74@qacmjeq.com',
                           'w0fhxx0d81@vafyxh.com',
                           'hz78qi32zv@somelora.com',
                           'timikzvjj56@rambler.ru',
                           'qiwvu1mb4y@qacmjeq.com',
                           'd78xz9w7t3@zlorkun.com',
                           'wu0v558h09@rfcdrive.com',
                           '0gvm57njz3@qejjyl.com',
                           '070p63jydr@gonetor.com',
                           'istemagjj56@rambler.ru',
                           'iz7373046e@vvatxiy.com',
                           'ww1nlpbckm@smykwb.com',
                           'b0g91u3jio@knmcadibav.com',
                           'nv0oek991n@qejjyl.com',
                           '67y71928vk@qejjyl.com',
                           'temazvl467@rambler.ru',
                           'qm46cd57i5@qzueos.com',
                           'jvyyxbvv46@somelora.com',
                           'mpi51ftlv4@qejjyl.com',
                           'zyv2ppmegj@qzueos.com',
                           '0vgrfecw2q@rfcdrive.com',
                           'ohtv8cyse1@qacmjeq.com',
                           'jbkefcb34t@gonetor.com',
                           'ne50yfmsto@knmcadibav.com',
                           'lcd6vt7am7@bltiwd.com',
                           '5j0zhkdluj@bltiwd.com',
                           'jeh0ul93zr@tidissajiiu.com',
                           '5nsdm8lxia@somelora.com',
                           'kjdt1q4vzq@wywnxa.com',
                           'r09mz67kiq@wywnxa.com',
                           'dhjhdf577@rambler.ru',
                           '0kosb5btck@qacmjeq.com',
                           '7gznz2ubt5@zvvzuv.com',
                           'x48c2dsud1@qacmjeq.com',
                           'q314mmm8iy@gonetor.com',
                           'e0qq6lyv4l@somelora.com',
                           'ao60hgf91d@qacmjeq.com',
                           'pmbr0872u2@smykwb.com',
                           'chbgi899@rambler.ru',
                           '9w6990cjqw@zlorkun.com',
                           'u1pzyteplr@tippabble.com',
                           'bg0ulqwr3b@qacmjeq.com',
                           'zj9bv489ji@tidissajiiu.com',
                           '6sp9r1nx2n@wywnxa.com',
                           'ebmgdzlagb@zvvzuv.com',
                           'y9q8b0idhi@rfcdrive.com',
                           'fotlpt8sly@bltiwd.com',
                           '10q4vjtygq@gonetor.com',
                           's6jmllrqf8@rfcdrive.com',
                           'uxco2gu5ab@qejjyl.com',
                           '8pwaomoazh@zlorkun.com',
                           'qnfi3wj8gv@tidissajiiu.com',
                           'azkwddl2fc@gonetor.com',
                           'sdjskdll@rambler.ru',
                           'duwjhy0vi4@knmcadibav.com',
                           'dhjjkj@myrambler.ru',
                           'ev53pcdvrn@knmcadibav.com',
                           'sghjjk@rambler.ru',
                           '7rocjeyidp@qacmjeq.com',
                           'dhkkkbv466@rambler.ru',
                           '9tf96nfgsk@wywnxa.com',
                           'gz9a8ujdnp@zlorkun.com',
                           'ij7n3m6zhn@somelora.com',
                           '2fjdl9wu8h@bltiwd.com',
                           'lslskkdk@rambler.ru',
                           '3q5qgj0kmb@zlorkun.com',
                           'drnisgjjb@rambler.ru',
                           'scvbjjk@rambler.ru',
                           'strelkovzosim7077@mail.ru',
                           'tringramernar1974@mail.ru',
                           'eduard_osipov_94@list.ru',
                           'abacscidro1988@mail.ru',
                           'uvarovalyubistina8578@mail.ru',
                           'strelkovamariya19823@list.ru',
                           'naryshkina81@mail.ru',
                           'nekrasovaalina96@mail.ru',
                           'mirraershova957962@mail.ru',
                           'sulamifkuznecova822860@mail.ru',
                           'centterpodi1987@mail.ru',
                           'markiy_rozhkov@bk.ru',
                           'sazonovaljph1985@mail.ru',
                           'eliseevapaulina19891881@mail.ru',
                           'naoo24@mail.ru',
                           'zaicevfotii801815@mail.ru',
                           'scelimcomdo1985@mail.ru',
                           'buxdorind@yandex.ru',
                           'danilovagelena84@mail.ru',
                           'nastasya_smirnova_10@mail.ru',
                           'svoboda.m777@gmail.com',
                           'fxnqduveyurya@bk.ru',
                           'makhmudkerimdanishevich@mail.ru',
                           'trisraguites1980@mail.ru',
                           'touiwyyovhqzsf@inbox.ru',
                           'miroslavatimofeeva11@gmail.com',
                           'mihailovatrifena4412@list.ru',
                           'nekrasovgavriil1983@list.ru',
                           'gluticphytur1982@mail.ru',
                           'rioprosadim1975@mail.ru',
                           'robertinaloginova1994@mail.ru',
                           'e33hu3ly0v@qejjyl.com',
                           'iisus.khristos.2025@mail.ru',
                           'solomoniyaefremova19961@bk.ru',
                           'ainazimina19846102@inbox.ru',
                           'sobashnikovfenton@bk.ru',
                           'moiseevkazimir4@bk.ru',
                           'zaicevahilya941328@inbox.ru',
                           'kandreevrodii@mail.ru',
                           'edripumae1976@mail.ru',
                           'carteru5emoto@bk.ru',
                           'tradefbican1988@mail.ru',
                           'xhcr9aqvon@qacmjeq.com',
                           'vanch24@bk.ru',
                           'finogenzaicev1994@list.ru',
                           'golubevaanfusa94@bk.ru',
                           'victor342@bltiwd.com',
                           'orlovpetr8043@list.ru',
                           'quinomiquae1976@mail.ru',
                           'magnitavorobeva1988@list.ru',
                           'wyorctwawghbk@bk.ru',
                           'efalammap1973@mail.ru',
                           'ustinovaleontina19984260@inbox.ru',
                           'lauritamolchanova19968358@list.ru',
                           'dy18ygsb98@somelora.com',
                           's73fvm599s@knmcadibav.com',
                           'ronygyju@polkaroad.net',
                           'gyulnarasimonova5436@inbox.ru',
                           'petuhovstepan89@bk.ru',
                           'verrotauma1987@mail.ru',
                           'gs8l0v043k@zvvzuv.com',
                           'fletagullqwdy@mail.ru',
                           'erikskhriukin@mail.ru',
                           'kdvgo4r96r@tidissajiiu.com',
                           'engelinabelozerova19896813@mail.ru',
                           'n-pastuhova@mail.ru',
                           'lazarevmilii955529@list.ru',
                           'nika_shcherbakova_97@bk.ru',
                           '00jl4298ea@zvvzuv.com',
                           'rybakoveremei19911944@list.ru',
                           'w76z11pwp7@tidissajiiu.com',
                           '8j38kpnu79@zlorkun.com',
                           'scepsatis_521@mail.ru',
                           'protelmavol1975@mail.ru',
                           'stavrlapin1982@inbox.ru',
                           'denediali1970@mail.ru',
                           'terppusiopoc1972@mail.ru',
                           'biryukovafeonina93@list.ru',
                           'dykuxemy@polkaroad.net',
                           'ycder3v29e@bltiwd.com',
                           'amvrosiisavin875717@bk.ru',
                           'shubinamstislava19749236@bk.ru',
                           'allimever1987@mail.ru',
                           '9k717xht8w@zlorkun.com',
                           'olga_nazarova_2022@mail.ru',
                           'o9u9xkc54c@tippabble.com',
                           'illarionzimin1990@inbox.ru',
                           'artemevamiliya67@mail.ru',
                           'subctarili1988@mail.ru',
                           'harita541yakovleva1992@bk.ru',
                           'amataorehova714@list.ru',
                           'pecheimacmet1988@mail.ru',
                           'alexandr57643@zvvzuv.com',
                           '4veo4rxnpd@zvvzuv.com',
                           'evdmtfgvvyyehk@list.ru',
                           'orionmorozov86@bk.ru',
                           '0e0ekypwaw@wywnxa.com',
                           'inapatag1985989@mail.ru',
                           'dasha.likhota@gmail.com',
                           'lnka9nroit5je9v8@list.ru',
                           'symazugy@logsmarter.net',
                           'aleksandravinogradova9191@bk.ru',
                           'bm4jorgjeu@rfcdrive.com',
                           'krylovadora9974@bk.ru',
                           'seliverstovagella19951845@inbox.ru',
                           'feoktistsavin6132@inbox.ru',
                           'sharovferapont829110@bk.ru',
                           'nomapigra1980@mail.ru',
                           'ivanova.knit@yandex.ru',
                           'marikanarina647@mail.ru',
                           'genevieveq7q1w@inbox.ru',
                           'volkova9633@gmail.com',
                           'prininabno1978@mail.ru',
                           'pbmfyd227q@qacmjeq.com',
                           'ngxeghhxixtbt@list.ru',
                           'txoqtnc6xb@vafyxh.com',
                           'polia_polia11@mail.ru',
                           'nc4a349os8@bltiwd.com',
                           'camusipercfi1992@mail.ru',
                           '3y3po369lw@bltiwd.com',
                           'emfercuthur1985@mail.ru',
                           'galkinplaton19892115@inbox.ru',
                           'neunonoda1984@mail.ru',
                           'bajotape@azuretechtalk.net',
                           'rybakovlivii817821@bk.ru',
                           'myasnikovellii89@list.ru',
                           'tiodipaslat1980@mail.ru',
                           'oksanabogdanova91@bk.ru',
                           'marinamaria09@list.ru',
                           'lapinmiloslav1987@list.ru',
                           'x2yju4dli0@qacmjeq.com',
                           'rx11lvkvxc@rfcdrive.com',
                           '8m41brotdp@somelora.com',
                           'naldinafomicheva96@list.ru',
                           'cherniakovabaiat@mail.ru',
                           'momimi@teleg.eu',
                           'kryukovantioh841053@inbox.ru',
                           'ostromirbolshakov9268@mail.ru',
                           'sew83@mail.ru',
                           'polyakovaerlena924346@bk.ru',
                           'dina_kononova@list.ru',
                           'saecinaesa1971@mail.ru',
                           'ursulazimina4829@list.ru',
                           'valentinagl3v@bk.ru',
                           'pvr_sat@mail.ru',
                           'zaj38cb2ua@tidissajiiu.com',
                           'polina433@qejjyl.com',
                           'ershovstraton1988@mail.ru',
                           'tamaraygc1980@mail.ru',
                           'haudupdemen1981@mail.ru',
                           'katricemax2lx@inbox.ru',
                           'xysugaka@logsmarter.net',
                           'n.eesty@yandex.ru',
                           'hozas0vbv1@bltiwd.com',
                           'cvetkovsilvan97@mail.ru',
                           'epanchintsevkhamud@mail.ru',
                           'pulcpatheico1985@mail.ru',
                           'vencewindducic2002@mail.ru',
                           'radomir_kozlov@bk.ru',
                           'totmyaninakatsuko2@list.ru',
                           'mark3535@qzueos.com',
                           'simonovokean4584@list.ru',
                           'samoilovamira84@list.ru',
                           'sterininas1989@mail.ru',
                           'scenortritac1982@mail.ru',
                           'orlova-zid@mail.ru',
                           'xegalypa@logsmarter.net',
                           'matveevyurii8199@bk.ru',
                           'rodionovflorin9921@list.ru',
                           'marksinastrelkova976473@list.ru',
                           'rialitor_7701@mail.ru',
                           'hkkdeu12vt@tidissajiiu.com',
                           'falcon.75@mail.ru',
                           'syngnifeices1974@mail.ru',
                           'olga121@tidissajiiu.com',
                           'gorazd128gromov1997@mail.ru',
                           'gordeevaerika94@list.ru',
                           'lsflhaoudivlpk@inbox.ru',
                           'leonginakazakova19894194@bk.ru',
                           'dominikasaveleva88@bk.ru',
                           'mitlaxicel1973@mail.ru',
                           'agafonovafeliciya90@list.ru',
                           'lugehe@teleg.eu',
                           'miheevevlampii973396@list.ru',
                           'ofk4113@mail.ru',
                           'zad5ukvpnb@tidissajiiu.com',
                           'mariya198080@mail.ru',
                           'kallinikgurev88450@mail.ru',
                           'dnre98njl5@tippabble.com',
                           'amceritu1981509@mail.ru',
                           'bakhtikeimakashova@mail.ru',
                           'merkushevainessa5997@list.ru',
                           'elmir_antonov@mail.ru',
                           'tuniostagce1978@mail.ru',
                           'tioenamim1989@mail.ru',
                           'xilyfe@polkaroad.net',
                           'medvedevaiolla979768@mail.ru',
                           '2ko4p5n21y@knmcadibav.com',
                           'kopylovaaida19897590@bk.ru',
                           'congphoterme1978461@mail.ru',
                           'globisimpo1973516@mail.ru',
                           'vlzozg84pw@dygovil.com',
                           'isakovaerlena971@mail.ru',
                           'quecurrapa1982@mail.ru',
                           'anastasiyakopylova1994@bk.ru',
                           'tioturuslau1983@mail.ru',
                           'uxey0ybvb8@vvatxiy.com',
                           'antonillavlasova19974907@list.ru',
                           'sf1el5ycep@bltiwd.com',
                           'vorontsov_garold@list.ru',
                           'schukinaelmira77@list.ru',
                           'kicypuhe@teleg.eu',
                           'kirenaermakova8383@bk.ru',
                           'smirnovisai28@list.ru',
                           'dempsennocia1986@mail.ru',
                           'tricpacaver1972@mail.ru',
                           'ouyvlfkv06@qzueos.com',
                           'lipatkonovalov199726@mail.ru',
                           'felicidadc554c@bk.ru',
                           'anastasiasoloveva919@gmail.com',
                           'rozhkovahso1976@mail.ru',
                           'biryukovaahk1998@mail.ru',
                           'quasliforci1978@mail.ru',
                           'nymysazo@cyclelove.cc',
                           'zfxk2em9wc@smykwb.com',
                           'qefjx3pomz@qejjyl.com',
                           'diamaraterenteva6473@inbox.ru',
                           'rebekkajdanova19902221@inbox.ru',
                           '5uwchf9cdv@knmcadibav.com',
                           'evdokimovaninella8858@mail.ru',
                           'bobylevgellii1982@bk.ru',
                           'trannueruefo1983@mail.ru',
                           'tesnagu8kc@zvvzuv.com',
                           'aq2e6vybkn@qejjyl.com',
                           'marionillaaleksandrova4@mail.ru',
                           'artemiisokolov1992@bk.ru',
                           'tapugtunpe1979@mail.ru',
                           'eva507269@gmail.com',
                           'hohlovajozefina19817130@bk.ru',
                           'fedotovdomaneg936856@bk.ru',
                           'rudadaze@logsmarter.net',
                           '6ujy65zlxg@tippabble.com',
                           'samopialovsiveif@mail.ru',
                           '1eye41fiif@knmcadibav.com',
                           'kokhanovvargas@mail.ru',
                           'elmirmaksimov99@mail.ru',
                           'fkr2nnnh1z@qacmjeq.com',
                           'nosovamarkiya1987@list.ru',
                           'klarisakulakova9986@bk.ru',
                           'uluq44mkor@wywnxa.com',
                           '5xcc9m7h2y@zlorkun.com',
                           'kany2427@mail.ru',
                           'cafuniadi1974@mail.ru',
                           'filippovakveta1992@mail.ru',
                           'zevinasoloveva813476@bk.ru',
                           'yudjingalkin911441@mail.ru',
                           'chlwqfaeeklhyj@inbox.ru',
                           'fahikyry@azuretechtalk.net',
                           'fonzikaragodin84@inbox.ru',
                           '2l3ztkq8oi@dygovil.com',
                           'melnikovasaf44@mail.ru',
                           'bogdanovavera1991@inbox.ru',
                           'tverdimirefimov1999@inbox.ru',
                           'tw8qi870vr@qejjyl.com',
                           'tqoq0po5kz@wywnxa.com',
                           'rubenbolshakov198524@mail.ru',
                           'n10bhzarx4@wywnxa.com',
                           'sevilbiryukova5@mail.ru',
                           'gusevazara874958@inbox.ru',
                           'febnapechar1977@mail.ru',
                           '9kxwud6z0c@zlorkun.com',
                           'magshukvediashkin@mail.ru',
                           'nellimamontova9768@mail.ru',
                           'cihenary@azuretechtalk.net',
                           '24aah77pzj@bltiwd.com',
                           'erphancaemis1989@mail.ru',
                           'sorokinadagmara963780@inbox.ru',
                           'wbqz0yzot1@zlorkun.com',
                           'hannaselezneva1993@inbox.ru',
                           'svyatoslavtretyakov19965748@inbox.ru',
                           'ug04ru0k2y@vvatxiy.com',
                           'lapinaarina19915@mail.ru',
                           'lobanovaideya76611@mail.ru',
                           'frolvlasov9758@bk.ru',
                           'jorespavlov7116@list.ru',
                           'aleksandramorozova1985@inbox.ru',
                           'gxu80s0ywv@tidissajiiu.com',
                           'lujemahu@teleg.eu',
                           'tawanakra0hji@bk.ru',
                           '5g27t1ospv@zvvzuv.com',
                           'roman_trofimov_1975@inbox.ru',
                           'quemarmina1978745@mail.ru',
                           '7wnet8009v@bltiwd.com',
                           'uctzvykgxyyng@list.ru',
                           'v8744uon1n@vafyxh.com',
                           '4ebvw9dnum@wywnxa.com',
                           'sysoevainda82@inbox.ru',
                           'lidiyakonstantinova83@list.ru',
                           'extisermag1986@mail.ru',
                           'valdemarchernov9310@list.ru',
                           'alasdairkutkin@mail.ru',
                           'palladasafonova1722@bk.ru',
                           'redegelo@azuretechtalk.net',
                           'voroncovajeneveva1986@list.ru',
                           'pokrovskij_zhenya_pokrovskiy_19@bk.ru',
                           'mariannaorlova96@list.ru',
                           'sxflozs0r0@somelora.com',
                           'mamontovteodor197495@bk.ru',
                           'dgrbuxekhm@zlorkun.com',
                           'ellavladimirova19942088@list.ru',
                           'shji17wilm@dygovil.com',
                           'vasilidvladimirov924728@list.ru',
                           'difsucufie1974@mail.ru',
                           'schukinleont85936@bk.ru',
                           'leographca_391@mail.ru',
                           'grohneratov685@inbox.ru',
                           '24nvdh3en6@somelora.com',
                           'vadik.va.24@inbox.ru',
                           'jocogy@cyclelove.cc',
                           'confconmufun1978@mail.ru',
                           'sponincol_2494@mail.ru',
                           'antoniyamironova19822845@mail.ru',
                           'isaaklapin828717@list.ru',
                           '9b5zaopkyt@qacmjeq.com',
                           'stanislav_lvov_1979@inbox.ru',
                           'falassakobzeva1995558@list.ru',
                           'rh6jo45iu0@wywnxa.com',
                           'tumadiapor1981224@mail.ru',
                           'tania-mishuta@mail.ru',
                           'buepinut_5658@mail.ru',
                           'svetlanakapustina98@bk.ru',
                           'thrompaslenver1979@mail.ru',
                           'yuriyryabov8cfj@mail.ru',
                           'medeyaermakova1986@bk.ru',
                           'roksana_zigalova@mail.ru',
                           'htffujqxfnsdf3drega@list.ru',
                           'vladismirdeviashin@mail.ru',
                           'nai.nina@bk.ru',
                           'katekrechman@gmail.com',
                           'etvohom1vh@vafyxh.com',
                           'ninortovich_marya@mail.ru',
                           'betseyalliob3f@list.ru',
                           'tz9ck64req@dygovil.com',
                           'kirya_savelev_91@inbox.ru',
                           'galatamorozova4806@inbox.ru',
                           'gorshkovselevkii8125@inbox.ru',
                           'firoma@clip.lat',
                           'mironovavilenina84@list.ru',
                           'carmelagricus@bk.ru',
                           'ublwdsomjxharp9p@bk.ru',
                           'kostinyulii19723409@inbox.ru',
                           'volgavolgaqaz@gmail.com',
                           'valeriya2004morozova@gmail.com',
                           'o9yvd0v68u@somelora.com',
                           'leonidakulakova83@mail.ru',
                           'petrbelousov19803880@inbox.ru',
                           'glinskihaflorentina5807@bk.ru',
                           'loludamy@logsmarter.net',
                           'arina.doshkevich@mail.ru',
                           'fevralinpahomov8464@bk.ru',
                           'r407a0dbhv@zvvzuv.com',
                           'robertinamerkusheva9@bk.ru',
                           'siputciti1976@mail.ru',
                           'dyachkovtiverii1443@bk.ru',
                           'lorak4rzss@gonetor.com',
                           'mariverafil@gmail.com',
                           '2ms3acbz8q@bltiwd.com',
                           'voronin_tyoma@bk.ru',
                           'gordeevaoliviya1984@mail.ru',
                           'sashasasha04349484848@mail.ru',
                           'ioannikiidavydov19812832@mail.ru',
                           'liromarda1973@mail.ru',
                           'vibibasi@polkaroad.net',
                           'sofonkapustin19913764@inbox.ru',
                           'vindeimuravev1998@inbox.ru',
                           'juravlevaantoniya5500@inbox.ru',
                           '3okv9ljykw@dygovil.com',
                           'cagalleare1987@mail.ru',
                           'romanishinabagor@mail.ru',
                           '1qcjpmot84@qacmjeq.com',
                           'usladasaveleva83@inbox.ru',
                           'fedoranikonova2018@mail.ru',
                           'kirillov_gelasiy@list.ru',
                           'viloriyasorokina19986416@list.ru',
                           'vunemo@clip.lat',
                           'qvra2c0qac@dygovil.com',
                           'ingupulma1989@mail.ru',
                           'sashina.24@bk.ru',
                           'natalya.kotova.85@list.ru',
                           'funbtatethambro1996@mail.ru',
                           'papequilea1976@mail.ru',
                           'esevmicis1975863@mail.ru',
                           'kopylovfotin3862@bk.ru',
                           'wjccnk4rrq@qejjyl.com',
                           'paisiiponomarev19855889@mail.ru',
                           'paulettesejpo@bk.ru',
                           'odincovaneonila1996@inbox.ru',
                           'kiselevflorian835374@bk.ru',
                           'feshchukovengibar@mail.ru',
                           'scarfecbeput1988@mail.ru',
                           'pybaveqa@polkaroad.net',
                           'primersipae1983@mail.ru',
                           'ligiyakarpova1982@bk.ru',
                           'caenapidi1974@mail.ru',
                           'natali330106@gmail.com',
                           'isaevakasiniya19826217@list.ru',
                           'hdyvswsbws@vvatxiy.com',
                           'tigran753gromov1983@bk.ru',
                           'vidanabelousova858317@inbox.ru',
                           'stepanovalora98@inbox.ru',
                           'romoltaconti2000@mail.ru',
                           'valentinavinogradova1991@list.ru',
                           'weqeriji@azuretechtalk.net',
                           'vestaagafonova85@list.ru',
                           'karponosovamugaimat1987@mail.ru',
                           'qaxloujz2f@knmcadibav.com',
                           'trucimthromta1982@mail.ru',
                           'baileyalexa19957984@inbox.ru',
                           'ninka.avdonina.24@mail.ru',
                           'lyubomirkonstantinov5@inbox.ru',
                           'banushkinkutkilia@mail.ru',
                           'tunquilasvi1987@mail.ru',
                           'bobylevaevangelina19949685@bk.ru',
                           'zhanna_ilina_90@inbox.ru',
                           'wawimyhi@cyclelove.cc',
                           'valyok_morozov_1998@bk.ru',
                           'quiceprusi1977@mail.ru',
                           'sofonfilatov1989@mail.ru',
                           'lqw5ir0dpv@qejjyl.com',
                           'evdokimovkaspar82@mail.ru',
                           'paisii993stepanov1988@bk.ru',
                           'lukinavgust936292@inbox.ru',
                           'komfort52@bk.ru',
                           'proppecildic1986@mail.ru',
                           'seviliyasidorova97@bk.ru',
                           'kristinatretyakova87@list.ru',
                           'qagikoly@azuretechtalk.net',
                           'evansleah9222@inbox.ru',
                           'ninka.ninka.24@mail.ru',
                           'tincroconvo1979@mail.ru',
                           'avdeevaagrippina5@bk.ru',
                           'rji7zubef2@tidissajiiu.com',
                           'fomicheva_vera@mail.ru',
                           'aventinacvetkova1998@list.ru',
                           'fardusnikonorov@mail.ru',
                           'manuilloginov5536@inbox.ru',
                           'rochagregory9677@bk.ru',
                           'bilikelo@logsmarter.net',
                           'flaviyagorbacheva471@bk.ru',
                           'conquicicom1980@mail.ru',
                           'kapustinplaton19953088@inbox.ru',
                           'abdulhadyrpingin2000@mail.ru',
                           'sysoevyanuarii4043@mail.ru',
                           'pavlik_andreev_1993@inbox.ru',
                           'vadik.vadik.24@list.ru',
                           'n4i9ntchgr@vvatxiy.com',
                           'icfyeys0vf@dygovil.com',
                           'f58dgt28cb@tippabble.com',
                           'lutovinavtendil@mail.ru',
                           'gromovaerlena6223@inbox.ru',
                           'ticabibcil1976@mail.ru',
                           'vyacheslav_chistyakov_1987@bk.ru',
                           'nizeny@teleg.eu',
                           'feraponttihonov95@bk.ru',
                           'denisovsabir19833136@list.ru',
                           'yuniyalazareva19667551@inbox.ru',
                           'ostreikovdzhurbek@mail.ru',
                           '5v38abzf4r@tidissajiiu.com',
                           'gdjbgbjhuwcaht@list.ru',
                           'aleksandrayakovaleva1977@inbox.ru',
                           'z3uuszp1ew@zvvzuv.com',
                           'asha.k.24@mail.ru',
                           'milisasharovatova@mail.ru',
                           'vasilisa2015badanina@gmail.com',
                           'gnoslanacar1984@mail.ru',
                           'pistprovidab1981@mail.ru',
                           'tranalirsa1978824@mail.ru',
                           'swsvr5uwec@somelora.com',
                           '0rfs6d9dxo@qzueos.com',
                           'lisyxoka@teleg.eu',
                           'dominque4nsehut@inbox.ru',
                           'yaroslavasubbotina1992@inbox.ru',
                           'tainakiseleva19956547@inbox.ru',
                           'arminiyabolshakova@inbox.ru',
                           'kondratevaalfa1889@mail.ru',
                           '5a6q968rb4@tidissajiiu.com',
                           'germogenbelyaev19901973@bk.ru',
                           '0auf5k8yca@qejjyl.com',
                           'xojtedbmyl@knmcadibav.com',
                           'lolitaafanaseva19978698@inbox.ru',
                           'vadik.vaadik@mail.ru',
                           'avramovdzhamol@mail.ru',
                           'bolshakoviba1985@mail.ru',
                           'zefixo@clip.lat',
                           'sharonaguilarhne0p@bk.ru',
                           '4c30ynuvsb@qejjyl.com',
                           'bbfoi1gll0@vvatxiy.com',
                           'alisha.sheremetova@yandex.ru',
                           'tioriquide1970@mail.ru',
                           'eyfobu8my3@bltiwd.com',
                           'monecasi1972334@mail.ru',
                           'lvgjkvtkto@qacmjeq.com',
                           'leteckiiyuzai83@mail.ru',
                           'naumovmaksim15@inbox.ru',
                           '3tfmld7a2c@somelora.com',
                           'timuxodo@azuretechtalk.net',
                           'ksanfippaafanaseva1996@bk.ru',
                           'asafiisuhanov1981@list.ru',
                           'yht7nrnrbj@qejjyl.com',
                           'emiliansafonov961836@inbox.ru',
                           'kkkwx0ghgj@tidissajiiu.com',
                           'beauplakkeyln@inbox.ru',
                           'nekina@teleg.eu',
                           'gintarasbalobanov@mail.ru',
                           'y41cw3p1pu@rfcdrive.com',
                           'zaytsev_nadir@bk.ru',
                           'sidorovadagmara88@bk.ru',
                           'avdeevaippolita93@bk.ru',
                           'kaxyfucsoy@rfcdrive.com',
                           'alfiyasazonova19927@list.ru',
                           'zymaliqo@logsmarter.net',
                           'dd4xiz4ljc@qzueos.com',
                           'marisem1989@gmail.com',
                           'bocvk1ozbw@vvatxiy.com',
                           'ctl8zcl7q2@tippabble.com',
                           'vobyfife@clip.lat',
                           'yynkph27p9@knmcadibav.com',
                           'm45499888@gmail.com',
                           'zihetubi@polkaroad.net',
                           'qvanuuvk2t@vafyxh.com',
                           'bickovamarine@yandex.ru',
                           '79522021969@yandex.ru',
                           'kotewycy@cyclelove.cc',
                           'x4262774252@gmail.com',
                           'ayocsz3mwn@wywnxa.com',
                           'lhh5ie8q4i@vvatxiy.com',
                           'nasonova-mari@rambler.ru',
                           'ilona.petrova.00@bk.ru',
                           'whzigf93ya@qzueos.com',
                           'tyss9l@mail.ru',
                           'ca30lleuk4@gonetor.com',
                           'blakcat23@yandex.ru',
                           'atabieva_albina@mail.ru',
                           'uxih9azt4y@somelora.com',
                           'artem.sov52@gmail.com',
                           'vaenga21@rambler.ru',
                           'buv1u2xtcs@gonetor.com',
                           'ellizevas@gmail.com',
                           'alla.ks.87@mail.ru',
                           'vb24fzfk9i@knmcadibav.com',
                           'elizavetasibiryakova@yandex.ru',
                           'hpclhucq93@qacmjeq.com',
                           'jyleva@mail.ru',
                           'mcfogt2utf@tidissajiiu.com',
                           'ymbzoos42e@bltiwd.com',
                           'suxarick2000@gmail.com',
                           'angegardien@mail.ru',
                           'kljzjxvvf5@knmcadibav.com',
                           'kudryavtseva.aleksandra1701@gmail.com',
                           'dixono9798@cetnob.com',
                           'eyzc7jwgd7@qzueos.com',
                           'pp2aubj7ob@vafyxh.com',
                           '3cvmayb2xw@qzueos.com',
                           '3bac1u87rf@tidissajiiu.com',
                           'lenchik2183@mail.ru',
                           'maria.smolova12@gmail.com',
                           'lzzgc7np5p@vvatxiy.com',
                           'at7cpbwbt2@vvatxiy.com',
                           'mohamedsofi@yandex.ru',
                           'dqh0bf21ml@vvatxiy.com',
                           'nyrik33rus@mail.ru',
                           'amyc16qaym@rfcdrive.com',
                           'yx83e8jcxa@qacmjeq.com',
                           'c471qmx8ma@vafyxh.com',
                           'otcv278gyt@qzueos.com',
                           'lqtvn252xa@qzueos.com',
                           'ynfzphmyou@rfcdrive.com',
                           '5rll0g3lxv@qzueos.com',
                           'vi_babich@mail.ru',
                           'verasoldatova23@gmail.com',
                           'lighttik@mail.ru',
                           'eq3s9kq8py@tidissajiiu.com',
                           'illuminescence@mail.ru',
                           'e3uacfhvet@zlorkun.com',
                           'huz2a6t3nb@wywnxa.com',
                           'e37nv99mup@dygovil.com',
                           'qkga0k7xew@gonetor.com',
                           'eqffjh7mrg@smykwb.com',
                           'hpymsezjxx@vvatxiy.com',
                           'vitalina.krupnova.03@mail.ru',
                           'danshina1991@inbox.ru',
                           'zxsfuekr04@rfcdrive.com',
                           'esechka_@mail.ru',
                           'bvc4h55t0l@dygovil.com',
                           'gdvm1vocj4@vvatxiy.com',
                           'gyma72@mail.ru',
                           'chrmryvmmd@somelora.com',
                           '3jgx795qvb@qacmjeq.com',
                           'xv375mqy5v@somelora.com',
                           'z0evegg5ty@vafyxh.com',
                           'j74p0527kw@bltiwd.com',
                           'ri7syllrjf@dygovil.com',
                           'mh1pjxwe97@bltiwd.com',
                           'ep_babich@mail.ru',
                           'kasatik613@yandex.ru',
                           '7zat1cprf7@wywnxa.com',
                           '5cuekpqq9m@zlorkun.com',
                           '5c234gzcb6@qejjyl.com',
                           'kg0qml32tp@wywnxa.com',
                           'proso45@list.ru',
                           'o_k_s_a_n_a_1977@mail.ru',
                           'qwp1oqsvqb@qacmjeq.com',
                           'xjmawj1p37@zvvzuv.com',
                           'spjq0vrduc@vafyxh.com',
                           'ozjsqv9jf7@wywnxa.com',
                           '3iqmkzd0re@vvatxiy.com',
                           'alisqwe649@gmail.com',
                           'rqw9pobgww@qacmjeq.com'
            )

    `
    return {}
  }

  async createFile(
    path: string,
    fileName: string,
    data: string,
  ): Promise<void> {
    // if (!this.checkIfFileOrDirectoryExists(path)) {
    //   fs.mkdirSync(path);
    // }

    const writeFiles = promisify(writeFile);

    return await writeFiles(`${path}/${fileName}`, data, 'utf8');
  }

  async findManyUsersByName(name: string): Promise<any> {
    return this.dbService.user.findMany({
      take: 10,
      orderBy: {
        videoLikes: {
          _count: 'desc'
        }
      },
      where: {
        name: {
          contains: name
        }
      },
      include: {
        videoLikes: {
          select: {
            id: true,
            video_id: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        }
      }
    })
  }

  async findFirstSongById(id: number): Promise<any> {
    const song = "https://firebasestorage.googleapis.com/v0/b/testing-98cd8.appspot.com/o/images%2F1725226282184?alt=media&token=5c0ccc8f-f8d1-4c65-8385-e21b695de6cb"
    const readStream = createReadStream(song)
    return new StreamableFile(readStream)
    return this.dbService.song.findFirst({
      where: {
        id: id
      }
    })
  }

}
